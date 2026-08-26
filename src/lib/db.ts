import Dexie, { type EntityTable } from "dexie";
import { formatPeriodLabel } from "./recurrence";
import type { BillingPeriod, Card, RecurrenceCadence, RecurringRule, Snapshot, SyncPayload, Transaction } from "./types";
import { newId, todayIso } from "./utils";

class CardflowDB extends Dexie {
  cards!: EntityTable<Card, "id">;
  periods!: EntityTable<BillingPeriod, "id">;
  transactions!: EntityTable<Transaction, "id">;
  recurring!: EntityTable<RecurringRule, "id">;
  meta!: EntityTable<{ key: string; value: string }, "key">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      cards: "id, name, sort_order",
      periods: "id, period_date",
      transactions: "id, card_id, billing_period_id, txn_date, type, created_at",
      recurring: "id, card_id, active",
      meta: "key",
    });
  }
}

type Active = { userId: string; db: CardflowDB };
let active: Active | null = null;
let applyingRemote = false;
let changeHandler: (() => void) | null = null;

export function getDb() {
  if (!active) throw new Error("Database is not open");
  return active.db;
}

export function onDatabaseChange(handler: (() => void) | null) {
  changeHandler = handler;
}

async function markDirty() {
  const now = new Date().toISOString();
  await getDb().meta.put({ key: "sync_dirty", value: "1" });
  await getDb().meta.put({ key: "local_updated_at", value: now });
}

function emitChange() {
  if (applyingRemote) return;
  void markDirty().then(() => changeHandler?.());
}

export const db = {
  get cards() {
    return getDb().cards;
  },
  get periods() {
    return getDb().periods;
  },
  get transactions() {
    return getDb().transactions;
  },
  get recurring() {
    return getDb().recurring;
  },
  get meta() {
    return getDb().meta;
  },
};

export async function openUserDatabase(userId: string) {
  if (active?.userId === userId) return active.db;
  active?.db.close();
  const instance = new CardflowDB(`cardflow_${userId}`);
  await instance.open();
  active = { userId, db: instance };
  return instance;
}

export function closeUserDatabase() {
  active?.db.close();
  active = null;
}

export async function replaceSnapshot(data: Snapshot, silent = false) {
  const dbx = getDb();
  await dbx.transaction("rw", dbx.cards, dbx.periods, dbx.transactions, dbx.recurring, async () => {
    await dbx.cards.clear();
    await dbx.periods.clear();
    await dbx.transactions.clear();
    await dbx.recurring.clear();
    if (data.cards?.length) await dbx.cards.bulkPut(data.cards);
    if (data.periods?.length) await dbx.periods.bulkPut(data.periods);
    if (data.transactions?.length) await dbx.transactions.bulkPut(data.transactions);
    if (data.recurring_rules?.length) await dbx.recurring.bulkPut(data.recurring_rules);
  });
  if (!silent) emitChange();
}

export async function exportLocalSnapshot(): Promise<SyncPayload> {
  const dbx = getDb();
  const [cards, periods, transactions, recurring, pref, excel] = await Promise.all([
    dbx.cards.toArray(),
    dbx.periods.toArray(),
    dbx.transactions.toArray(),
    dbx.recurring.toArray(),
    dbx.meta.get("default_period_filter"),
    dbx.meta.get("excel_revision"),
  ]);
  return {
    version: 1,
    cards,
    periods,
    transactions,
    recurring_rules: recurring,
    default_period_filter: pref?.value === "all" ? "all" : "closest_next",
    excel_revision: excel?.value ?? "",
  };
}

export async function applyRemoteSnapshot(payload: SyncPayload, remoteUpdatedAt: string) {
  applyingRemote = true;
  try {
    await replaceSnapshot(payload, true);
    await getDb().meta.put({
      key: "default_period_filter",
      value: payload.default_period_filter === "all" ? "all" : "closest_next",
    });
    if (payload.excel_revision) {
      await getDb().meta.put({ key: "excel_revision", value: payload.excel_revision });
    }
    await getDb().meta.put({ key: "sync_dirty", value: "0" });
    await getDb().meta.put({ key: "local_updated_at", value: remoteUpdatedAt });
    await getDb().meta.put({ key: "last_synced_at", value: remoteUpdatedAt });
  } finally {
    applyingRemote = false;
  }
}

export async function markSynced(remoteUpdatedAt: string) {
  await getDb().meta.put({ key: "sync_dirty", value: "0" });
  await getDb().meta.put({ key: "local_updated_at", value: remoteUpdatedAt });
  await getDb().meta.put({ key: "last_synced_at", value: remoteUpdatedAt });
}

export async function getSyncMeta() {
  const dbx = getDb();
  const [dirty, localUpdated, lastSynced, error] = await Promise.all([
    dbx.meta.get("sync_dirty"),
    dbx.meta.get("local_updated_at"),
    dbx.meta.get("last_synced_at"),
    dbx.meta.get("sync_error"),
  ]);
  return {
    dirty: dirty?.value === "1",
    localUpdatedAt: localUpdated?.value ?? "",
    lastSyncedAt: lastSynced?.value ?? "",
    error: error?.value ?? "",
  };
}

export async function setSyncError(message: string) {
  await getDb().meta.put({ key: "sync_error", value: message });
}

export async function addCard(input: Omit<Card, "id" | "created_at" | "sort_order">) {
  const count = await getDb().cards.count();
  const row: Card = {
    ...input,
    id: newId("card"),
    sort_order: count,
    created_at: new Date().toISOString(),
  };
  await getDb().cards.add(row);
  emitChange();
  return row;
}

function periodRow(period_date: string, label?: string): BillingPeriod {
  return {
    id: `per_${period_date}`,
    period_date,
    label: formatPeriodLabel(period_date, label),
    created_at: new Date().toISOString(),
  };
}

export async function addPeriod(period_date: string, label?: string) {
  const row = periodRow(period_date, label);
  await getDb().periods.put(row);
  emitChange();
  return row;
}

export async function addPeriods(dates: string[]) {
  const unique = [...new Set(dates)];
  const dbx = getDb();
  const existing = await dbx.periods.bulkGet(unique.map((d) => `per_${d}`));
  const existingDates = new Set(existing.filter(Boolean).map((p) => p!.period_date));
  const created = unique.filter((d) => !existingDates.has(d)).map((d) => periodRow(d));
  if (created.length) await dbx.periods.bulkPut(created);
  emitChange();
  return { created, skipped: unique.filter((d) => existingDates.has(d)) };
}

export async function addTransaction(input: {
  card_id: string;
  billing_period_id: string;
  type: Transaction["type"];
  amount: number;
  notes?: string;
  frequency?: Transaction["frequency"];
  txn_date?: string;
  recurring_rule_id?: string | null;
}) {
  const row: Transaction = {
    id: newId("txn"),
    card_id: input.card_id,
    billing_period_id: input.billing_period_id,
    recurring_rule_id: input.recurring_rule_id ?? null,
    txn_date: input.txn_date ?? todayIso(),
    type: input.type,
    frequency: input.frequency ?? "one_time",
    amount: input.amount,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };
  await getDb().transactions.add(row);
  emitChange();
  return row;
}

export async function addRecurringSeries(input: {
  card_id: string;
  type: Transaction["type"];
  amount: number;
  notes?: string;
  cadence: RecurrenceCadence;
  start_date: string;
  occurrence_count: number;
  dates: string[];
  createMissingPeriods: boolean;
}) {
  const dbx = getDb();
  const notes = input.notes?.trim() || null;
  const now = new Date().toISOString();
  const result = await dbx.transaction("rw", dbx.periods, dbx.transactions, dbx.recurring, async () => {
    const createdPeriods: BillingPeriod[] = [];
    if (input.createMissingPeriods) {
      const existing = await dbx.periods.bulkGet(input.dates.map((d) => `per_${d}`));
      const have = new Set(existing.filter(Boolean).map((p) => p!.period_date));
      const toCreate = input.dates.filter((date) => !have.has(date)).map((date) => periodRow(date));
      if (toCreate.length) {
        await dbx.periods.bulkPut(toCreate);
        createdPeriods.push(...toCreate);
      }
    }

    const periods = await dbx.periods.bulkGet(input.dates.map((d) => `per_${d}`));
    const byDate = new Map(periods.filter(Boolean).map((p) => [p!.period_date, p!]));
    const datesToWrite = input.dates.filter((d) => byDate.has(d));
    if (datesToWrite.length === 0) {
      throw new Error("No matching billing periods for this series");
    }

    const rule: RecurringRule = {
      id: newId("sub"),
      card_id: input.card_id,
      type: input.type,
      amount: input.amount,
      notes,
      start_date: input.start_date,
      end_date: datesToWrite[datesToWrite.length - 1] ?? null,
      cadence: input.cadence,
      occurrence_count: input.occurrence_count,
      active: true,
      created_at: now,
    };
    await dbx.recurring.add(rule);

    const transactions: Transaction[] = datesToWrite.map((date) => ({
      id: newId("txn"),
      card_id: input.card_id,
      billing_period_id: byDate.get(date)!.id,
      recurring_rule_id: rule.id,
      txn_date: date,
      type: input.type,
      frequency: "recurring",
      amount: input.amount,
      notes,
      created_at: now,
    }));
    await dbx.transactions.bulkAdd(transactions);
    return { rule, transactions, createdPeriods };
  });
  emitChange();
  return result;
}

export async function undoRecurringSeries(input: {
  transactionIds: string[];
  periodIds: string[];
  ruleId: string;
}) {
  const dbx = getDb();
  await dbx.transaction("rw", dbx.periods, dbx.transactions, dbx.recurring, async () => {
    await dbx.transactions.bulkDelete(input.transactionIds);
    if (input.periodIds.length) await dbx.periods.bulkDelete(input.periodIds);
    await dbx.recurring.delete(input.ruleId);
  });
  emitChange();
}

export async function deleteTransaction(id: string) {
  await getDb().transactions.delete(id);
  emitChange();
}

export async function applyPendingDataFixes() {
  const dbx = getDb();
  const key = "fix_oneplus15_recurring_2027_08_30";
  const done = await dbx.meta.get(key);
  if (done?.value === "1") return;
  const rows = await dbx.transactions.toArray();
  const matches = rows.filter((t) => {
    const notes = (t.notes ?? "").trim().toLowerCase();
    const onDate = t.txn_date === "2027-08-30" || t.billing_period_id === "per_2027-08-30";
    return notes === "oneplus 15" && Number(t.amount) === 2500 && onDate && t.type === "charge" && t.frequency !== "recurring";
  });
  for (const t of matches) {
    await dbx.transactions.update(t.id, { frequency: "recurring" });
  }
  await dbx.meta.put({ key, value: "1" });
  if (matches.length) emitChange();
}

export async function getDefaultPeriodFilter(): Promise<"all" | "closest_next"> {
  const row = await getDb().meta.get("default_period_filter");
  return row?.value === "all" ? "all" : "closest_next";
}

export async function setDefaultPeriodFilter(value: "all" | "closest_next") {
  await getDb().meta.put({ key: "default_period_filter", value });
  emitChange();
}
