import type { RealtimeChannel } from "@supabase/supabase-js";
import syncSchema from "../../supabase/migrations/001_vite_user_state.sql?raw";
import {
  applyRemoteSnapshot,
  exportLocalSnapshot,
  getSyncMeta,
  markSynced,
  onDatabaseChange,
  setSyncError,
} from "@/lib/db";
import { importExcelIfEmpty } from "@/lib/excel-hydrate";
import { supabase } from "@/lib/supabase";
import type { SyncPayload } from "@/lib/types";

const TABLE = "vite_user_state";
const PUSH_DELAY_MS = 700;
const POLL_MS = 45_000;

type RemoteRow = { user_id: string; payload: SyncPayload; updated_at: string };

let pushTimer: number | null = null;
let pollTimer: number | null = null;
let channel: RealtimeChannel | null = null;
let activeUserId: string | null = null;
let pushing = false;

export const SYNC_TABLE_SQL = syncSchema.trim();

function isTableMissing(message: string, code?: string) {
  const text = `${code ?? ""} ${message}`.toLowerCase();
  return text.includes("vite_user_state") || text.includes("pgrst205") || text.includes("42p01");
}

function asPayload(value: unknown): SyncPayload | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<SyncPayload>;
  if (!Array.isArray(row.cards) || !Array.isArray(row.periods) || !Array.isArray(row.transactions)) return null;
  return {
    version: 1,
    cards: row.cards,
    periods: row.periods,
    transactions: row.transactions,
    recurring_rules: Array.isArray(row.recurring_rules) ? row.recurring_rules : [],
    default_period_filter: row.default_period_filter === "all" ? "all" : "closest_next",
    excel_revision: typeof row.excel_revision === "string" ? row.excel_revision : "",
  };
}

async function fetchRemote(userId: string): Promise<RemoteRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("user_id, payload, updated_at").eq("user_id", userId).maybeSingle();
  if (error) {
    const message = isTableMissing(error.message, error.code)
      ? "Cloud table is missing. Run the SQL in Settings once."
      : error.message;
    await setSyncError(message);
    throw error;
  }
  if (!data) return null;
  const payload = asPayload(data.payload);
  if (!payload) return null;
  return { user_id: data.user_id, payload, updated_at: data.updated_at };
}

async function localShouldWin(remote: RemoteRow) {
  const local = await getSyncMeta();
  const remoteTime = Date.parse(remote.updated_at);
  const localTime = local.localUpdatedAt ? Date.parse(local.localUpdatedAt) : 0;
  if (local.lastSyncedAt) return local.dirty && localTime > remoteTime;
  const snap = await exportLocalSnapshot();
  return snap.transactions.length > remote.payload.transactions.length;
}

async function pushLocal(userId: string) {
  if (!supabase || pushing || !navigator.onLine) return;
  pushing = true;
  try {
    const payload = await exportLocalSnapshot();
    const updatedAt = new Date().toISOString();
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, payload, updated_at: updatedAt },
      { onConflict: "user_id" },
    );
    if (error) {
      const message = isTableMissing(error.message, error.code)
        ? "Cloud table is missing. Run the SQL in Settings once."
        : error.message;
      await setSyncError(message);
      return;
    }
    await markSynced(updatedAt);
    await setSyncError("");
  } finally {
    pushing = false;
  }
}

export function schedulePush() {
  if (!activeUserId || !navigator.onLine) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    if (activeUserId) void pushLocal(activeUserId);
  }, PUSH_DELAY_MS);
}

export async function syncNow() {
  const userId = activeUserId;
  if (!userId || !supabase) return;
  if (!navigator.onLine) {
    await setSyncError("Offline — changes will sync when you reconnect.");
    return;
  }
  try {
    const remote = await fetchRemote(userId);
    if (remote && !(await localShouldWin(remote))) {
      await applyRemoteSnapshot(remote.payload, remote.updated_at);
      await setSyncError("");
      return;
    }
    const local = await getSyncMeta();
    if (local.dirty || !remote) {
      await pushLocal(userId);
      return;
    }
    await markSynced(remote.updated_at);
    await setSyncError("");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setSyncError(isTableMissing(message) ? "Cloud table is missing. Run the SQL in Settings once." : message);
  }
}

export async function startCloudSync(userId: string, email?: string) {
  activeUserId = userId;
  onDatabaseChange(schedulePush);
  if (!supabase || !navigator.onLine) {
    await importExcelIfEmpty(email);
    return;
  }
  try {
    const remote = await fetchRemote(userId);
    if (remote) {
      if (await localShouldWin(remote)) {
        await pushLocal(userId);
        return;
      }
      await applyRemoteSnapshot(remote.payload, remote.updated_at);
      await setSyncError("");
      return;
    }
    await importExcelIfEmpty(email);
    await pushLocal(userId);
  } catch {
    await importExcelIfEmpty(email);
  }
}

export function listenForCloudSync(userId: string) {
  const onOnline = () => void syncNow();
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisible);
  pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible" && navigator.onLine) void syncNow();
  }, POLL_MS);

  if (supabase) {
    channel = supabase
      .channel(`vite_user_state:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: `user_id=eq.${userId}` },
        () => {
          void getSyncMeta().then((meta) => {
            if (!meta.dirty) void syncNow();
          });
        },
      )
      .subscribe();
  }

  return () => {
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisible);
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = null;
    if (pushTimer) window.clearTimeout(pushTimer);
    pushTimer = null;
    if (channel && supabase) void supabase.removeChannel(channel);
    channel = null;
  };
}

export function stopCloudSync() {
  onDatabaseChange(null);
  activeUserId = null;
}
