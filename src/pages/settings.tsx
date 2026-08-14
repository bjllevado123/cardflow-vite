import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { getDefaultPeriodFilter, setDefaultPeriodFilter } from "@/lib/db";
import { signOut } from "@/lib/supabase";

export function SettingsPage() {
  const { user } = useAuth();
  const [pref, setPref] = useState<"all" | "closest_next">("closest_next");

  useEffect(() => {
    void getDefaultPeriodFilter().then(setPref);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Account and Transactions defaults for this device." />
      <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
        <h2 className="font-semibold">Account</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm">{user?.email ?? "Signed in"}</p>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
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
