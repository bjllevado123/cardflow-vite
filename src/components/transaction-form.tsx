import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RecurrenceFields, fieldClass } from "@/components/recurrence-fields";
import { Modal } from "@/components/ui/modal";
import { addRecurringSeries, addTransaction, deleteTransaction, undoRecurringSeries } from "@/lib/db";
import { formatDateList, generateOccurrenceDates, matchPeriodsForDates } from "@/lib/recurrence";
import type { BillingPeriod, Card, RecurrenceCadence } from "@/lib/types";
import { todayIso } from "@/lib/utils";

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
  const [recurring, setRecurring] = useState(false);
  const [cadence, setCadence] = useState<RecurrenceCadence>("monthly");
  const [count, setCount] = useState(6);
  const [txnDate, setTxnDate] = useState(todayIso);
  const [dayOfMonth, setDayOfMonth] = useState(() => Number(todayIso().slice(8, 10)));
  const [pending, setPending] = useState<{
    amount: number;
    card_id: string;
    notes: string;
    dates: string[];
    missing: string[];
  } | null>(null);

  const newestPeriod = [...periods].sort((a, b) => b.period_date.localeCompare(a.period_date))[0];
  const previewDates = useMemo(
    () => (recurring ? generateOccurrenceDates({ cadence, startDate: txnDate, count, dayOfMonth }) : []),
    [recurring, cadence, txnDate, count, dayOfMonth],
  );
  const previewMatch = useMemo(() => matchPeriodsForDates(previewDates, periods), [previewDates, periods]);

  function resetForm() {
    setError(null);
    setPending(null);
    setRecurring(false);
    setCadence("monthly");
    setCount(6);
    setTxnDate(todayIso());
    setDayOfMonth(Number(todayIso().slice(8, 10)));
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  async function commitSeries(
    input: { amount: number; card_id: string; notes: string; dates: string[] },
    createMissingPeriods: boolean,
  ) {
    try {
      const result = await addRecurringSeries({
        card_id: input.card_id,
        type,
        amount: input.amount,
        notes: input.notes,
        cadence,
        start_date: txnDate,
        occurrence_count: count,
        dates: input.dates,
        createMissingPeriods,
      });
      toast.success(
        `Added ${result.transactions.length} recurring ${type === "payment" ? "payments" : "charges"}`,
        {
          action: {
            label: "Undo",
            onClick: () =>
              void undoRecurringSeries({
                transactionIds: result.transactions.map((t) => t.id),
                periodIds: result.createdPeriods.map((p) => p.id),
                ruleId: result.rule.id,
              }),
          },
        },
      );
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the recurring series");
    }
  }

  async function save(fd: FormData) {
    setError(null);
    const amount = Number(String(fd.get("amount") ?? "").replace(/,/g, ""));
    const card_id = String(fd.get("card_id") ?? "");
    const notes = String(fd.get("notes") ?? "");
    if (!card_id || !(amount > 0)) {
      setError("Pick a card and an amount greater than 0");
      return;
    }

    if (recurring) {
      const dates = generateOccurrenceDates({ cadence, startDate: txnDate, count, dayOfMonth });
      if (dates.length === 0) {
        setError("Choose a start date and how many times this should repeat");
        return;
      }
      const { existing, missing } = matchPeriodsForDates(dates, periods);
      if (missing.length === 0) {
        await commitSeries({ amount, card_id, notes, dates }, false);
        return;
      }
      if (existing.length === 0 && missing.length > 0) {
        setPending({ amount, card_id, notes, dates, missing });
        return;
      }
      setPending({ amount, card_id, notes, dates, missing });
      return;
    }

    const billing_period_id = String(fd.get("billing_period_id") ?? "");
    if (!billing_period_id) {
      setError("Pick a card, period, and amount greater than 0");
      return;
    }
    const row = await addTransaction({
      card_id,
      billing_period_id,
      type,
      amount,
      notes,
      frequency: "one_time",
      txn_date: txnDate,
    });
    toast.success(type === "payment" ? "Payment saved" : "Charge logged", {
      action: { label: "Undo", onClick: () => void deleteTransaction(row.id) },
    });
    close();
  }

  return (
    <>
      {trigger === "header" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add
        </button>
      ) : null}
      <Modal
        open={open}
        onClose={close}
        title={pending ? "Missing billing periods" : recurring ? "Add recurring transaction" : "Add transaction"}
        description={
          pending
            ? "Some dates in this series do not have a billing period yet."
            : recurring
              ? "This will create one entry per date. If a billing period is missing, you can create it or skip it."
              : "Log a one-time charge or payment, or switch to Recurring for a series."
        }
        wide
      >
        {pending ? (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              {pending.missing.length} of {pending.dates.length} dates have no period: {formatDateList(pending.missing)}.
            </p>
            <button
              type="button"
              className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary"
              onClick={() => void commitSeries(pending, true)}
            >
              Create missing periods and all transactions
            </button>
            <button
              type="button"
              className="h-12 w-full rounded-xl border border-outline-variant font-semibold"
              disabled={pending.dates.length === pending.missing.length}
              onClick={() => {
                const missing = new Set(pending.missing);
                void commitSeries(
                  {
                    ...pending,
                    dates: pending.dates.filter((d) => !missing.has(d)),
                  },
                  false,
                );
              }}
            >
              Only add to existing periods
            </button>
            <button type="button" className="h-11 w-full text-sm font-medium text-on-surface-variant" onClick={() => setPending(null)}>
              Back
            </button>
          </div>
        ) : cards.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Add at least one card first.</p>
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
            <div>
              <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">How often</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecurring(false)}
                  className={`h-11 rounded-xl border text-sm font-semibold ${
                    !recurring ? "border-primary bg-primary text-on-primary" : "border-outline-variant"
                  }`}
                >
                  One-time
                </button>
                <button
                  type="button"
                  onClick={() => setRecurring(true)}
                  className={`h-11 rounded-xl border text-sm font-semibold ${
                    recurring ? "border-primary bg-primary text-on-primary" : "border-outline-variant"
                  }`}
                >
                  Recurring
                </button>
              </div>
            </div>
            {recurring ? (
              <RecurrenceFields
                cadence={cadence}
                count={count}
                startDate={txnDate}
                dayOfMonth={dayOfMonth}
                previewDates={previewDates}
                missingCount={previewMatch.missing.length}
                onCadenceChange={setCadence}
                onCountChange={setCount}
                onStartDateChange={(value) => {
                  setTxnDate(value);
                  const day = Number(value.slice(8, 10));
                  if (day) setDayOfMonth(day);
                }}
                onDayOfMonthChange={setDayOfMonth}
              />
            ) : null}
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Amount</span>
              <input name="amount" inputMode="decimal" required className={fieldClass} placeholder="0.00" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Card</span>
              <select name="card_id" defaultValue={defaultCardId ?? cards[0]?.id} className={fieldClass}>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {recurring ? null : (
              <label className="block">
                <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Period</span>
                <select name="billing_period_id" defaultValue={defaultPeriodId ?? newestPeriod?.id} className={fieldClass}>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {recurring ? null : (
              <label className="block">
                <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Date</span>
                <input
                  name="txn_date"
                  type="date"
                  value={txnDate}
                  className={fieldClass}
                  onChange={(e) => {
                    setTxnDate(e.target.value);
                    const day = Number(e.target.value.slice(8, 10));
                    if (day) setDayOfMonth(day);
                  }}
                />
              </label>
            )}
            <label className="block">
              <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Note</span>
              <input name="notes" className={fieldClass} placeholder="e.g. Shell Catarman" />
            </label>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button type="submit" className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary">
              {recurring ? "Save recurring series" : "Save"}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
