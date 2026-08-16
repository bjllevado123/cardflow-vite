import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { db, getDefaultPeriodFilter, setDefaultPeriodFilter } from "@/lib/db";
import { SYNC_TABLE_SQL, syncNow } from "@/lib/sync";

export function SettingsPage() {
  const { user } = useAuth();
  const [pref, setPref] = useState<"all" | "closest_next">("closest_next");
  const meta = useLiveQuery(() => db.meta.toArray()) ?? [];
  const metaMap = Object.fromEntries(meta.map((row) => [row.key, row.value]));
  const lastSynced = metaMap.last_synced_at;
  const syncError = metaMap.sync_error;
  const pending = metaMap.sync_dirty === "1";

  useEffect(() => {
    void getDefaultPeriodFilter().then(setPref);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Account, sync, and Transactions defaults for this device." />
      <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <h2 className="font-semibold">Account</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm">{user?.email ?? "Signed in"}</p>
          <SignOutButton />
        </div>
      </section>
      <section className="space-y-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <h2 className="font-semibold">Cloud sync</h2>
        <p className="text-sm text-on-surface-variant">
          When you are online, this device shares cards and transactions with your other CardFlow windows and the
          installed app.
        </p>
        <p className="text-sm">
          {lastSynced
            ? `Last synced ${new Date(lastSynced).toLocaleString()}`
            : navigator.onLine
              ? "Not synced yet"
              : "Offline"}
          {pending ? " · pending changes" : ""}
        </p>
        {syncError ? <p className="text-sm text-error">{syncError}</p> : null}
        <Button
          variant="outline"
          onClick={() => {
            void syncNow().then(() => toast.success("Sync finished"));
          }}
        >
          Sync now
        </Button>
        {syncError?.includes("Cloud table") ? (
          <div className="space-y-2">
            <p className="text-sm text-on-surface-variant">
              Paste this once in the CardFlow Supabase SQL editor, then tap Sync now.
            </p>
            <pre className="max-h-48 overflow-auto rounded-xl bg-surface-container-low p-3 text-xs">{SYNC_TABLE_SQL}</pre>
            <Button
              variant="ghost"
              onClick={() => {
                void navigator.clipboard.writeText(SYNC_TABLE_SQL).then(() => toast.success("SQL copied"));
              }}
            >
              Copy SQL
            </Button>
          </div>
        ) : null}
      </section>
      <section className="space-y-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <h2 className="font-semibold">Default period filter</h2>
        <p className="text-sm text-on-surface-variant">Used when you open Transactions with no period selected.</p>
        {(["all", "closest_next"] as const).map((value) => (
          <label
            key={value}
            className={`flex cursor-pointer flex-col rounded-2xl border px-4 py-3 ${
              pref === value ? "border-secondary bg-secondary-container/40" : "border-outline-variant"
            }`}
          >
            <span className="font-semibold">{value === "all" ? "All periods" : "Closest next date"}</span>
            <span className="text-sm text-on-surface-variant">
              {value === "all"
                ? "Show every transaction until you pick a period."
                : "Auto-select the next billing period on or after today."}
            </span>
            <input
              type="radio"
              className="sr-only"
              checked={pref === value}
              onChange={() => {
                setPref(value);
                void setDefaultPeriodFilter(value).then(() => toast.success("Saved"));
              }}
            />
          </label>
        ))}
      </section>
    </div>
  );
}
