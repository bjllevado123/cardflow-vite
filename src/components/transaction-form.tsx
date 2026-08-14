import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { addTransaction } from "@/lib/db";
import type { BillingPeriod, Card } from "@/lib/types";
import { todayIso } from "@/lib/utils";

const fieldClass =
  "mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 min-h-12 outline-none focus:border-primary";

export function TransactionForm({
  cards,
  periods,
  defaultOpen = false,
  trigger = "header",
  defaultCardId,
  defaultPeriodId,
}: {
  cards: Card[];
  periods: BillingPeriod[];
  defaultOpen?: boolean;
  trigger?: "header" | "none";
  defaultCardId?: string;
  defaultPeriodId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [type, setType] = useState<"charge" | "payment">("charge");
  const [error, setError] = useState<string | null>(null);

  const canSave = cards.length > 0 && periods.length > 0;
  const newestPeriod = [...periods].sort((a, b) => b.period_date.localeCompare(a.period_date))[0];

  async function save(fd: FormData) {
    setError(null);
    const amount = Number(fd.get("amount"));
    const card_id = String(fd.get("card_id") ?? "");
    const billing_period_id = String(fd.get("billing_period_id") ?? "");
    if (!card_id || !billing_period_id || !(amount > 0)) {
      setError("Pick a card, period, and amount greater than 0");
      return;
    }
    const row = await addTransaction({
      card_id,
      billing_period_id,
      type,
      amount,
      notes: String(fd.get("notes") ?? ""),
      frequency: fd.get("frequency") === "recurring" ? "recurring" : "one_time",
      txn_date: String(fd.get("txn_date") || todayIso()),
    });
    toast.success(type === "payment" ? "Payment saved" : "Charge logged", {
      action: { label: "Undo", onClick: () => void import("@/lib/db").then((m) => m.deleteTransaction(row.id)) },
    });
    setOpen(false);
  }

  return (
    <>
      {trigger === "header" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-11 px-5 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add
        </button>
      ) : null}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add transaction"
        description="Log a charge or payment against a billing period."
        wide
      >
        {!canSave ? (
          <p className="text-sm text-on-surface-variant">Add at least one card and one billing period first.</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save(new FormData(e.currentTarget));
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {(["charge", "payment"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`h-11 rounded-xl border text-sm font-semibold capitalize ${
                    type === t ? "border-primary bg-primary text-on-primary" : "border-outline-variant"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Amount</span>
              <input name="amount" inputMode="decimal" required className={fieldClass} placeholder="0.00" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Card</span>
              <select name="card_id" defaultValue={defaultCardId ?? cards[0]?.id} className={fieldClass}>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Period</span>
              <select
                name="billing_period_id"
                defaultValue={defaultPeriodId ?? newestPeriod?.id}
                className={fieldClass}
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Date</span>
              <input name="txn_date" type="date" defaultValue={todayIso()} className={fieldClass} />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] uppercase text-on-surface-variant">Note</span>
              <input name="notes" className={fieldClass} placeholder="e.g. Shell Catarman" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="frequency" value="recurring" />
              Recurring
            </label>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button type="submit" className="w-full h-12 rounded-xl bg-primary text-on-primary font-semibold">
              Save
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
