import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RecurrenceFields, fieldClass } from "@/components/recurrence-fields";
import { Modal } from "@/components/ui/modal";
import { addPeriod, addPeriods } from "@/lib/db";
import { generateOccurrenceDates } from "@/lib/recurrence";
import type { RecurrenceCadence } from "@/lib/types";
import { todayIso } from "@/lib/utils";

export function AddPeriodButton() {
  const [open, setOpen] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [cadence, setCadence] = useState<RecurrenceCadence>("monthly");
  const [count, setCount] = useState(6);
  const [startDate, setStartDate] = useState(todayIso);
  const [dayOfMonth, setDayOfMonth] = useState(() => Number(todayIso().slice(8, 10)));

  const previewDates = useMemo(
    () => (repeat ? generateOccurrenceDates({ cadence, startDate, count, dayOfMonth }) : []),
    [repeat, cadence, startDate, count, dayOfMonth],
  );

  function close() {
    setOpen(false);
    setRepeat(false);
    setCadence("monthly");
    setCount(6);
    setStartDate(todayIso());
    setDayOfMonth(Number(todayIso().slice(8, 10)));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-primary"
      >
        <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
        New period
      </button>
      <Modal
        open={open}
        onClose={close}
        title={repeat ? "New recurring periods" : "New billing period"}
        description={
          repeat
            ? "Create a series of billing dates from a start month and cadence."
            : "Same idea as duplicating an Excel tab for the 15th or 30th."
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              if (repeat) {
                const dates = generateOccurrenceDates({ cadence, startDate, count, dayOfMonth });
                if (dates.length === 0) return;
                const { created, skipped } = await addPeriods(dates);
                const extra = skipped.length ? ` (${skipped.length} already existed)` : "";
                toast.success(`Created ${created.length} period${created.length === 1 ? "" : "s"}${extra}`);
                close();
                return;
              }
              const fd = new FormData(e.currentTarget);
              const date = String(fd.get("period_date") ?? "");
              if (!date) return;
              await addPeriod(date, String(fd.get("label") ?? ""));
              toast.success("Period added");
              close();
            })();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {([false, true] as const).map((value) => (
              <button
                key={value ? "repeat" : "single"}
                type="button"
                onClick={() => setRepeat(value)}
                className={`h-11 rounded-xl border text-sm font-semibold ${
                  repeat === value ? "border-primary bg-primary text-on-primary" : "border-outline-variant"
                }`}
              >
                {value ? "Repeat" : "Single"}
              </button>
            ))}
          </div>
          {repeat ? (
            <RecurrenceFields
              cadence={cadence}
              count={count}
              startDate={startDate}
              dayOfMonth={dayOfMonth}
              previewDates={previewDates}
              onCadenceChange={setCadence}
              onCountChange={setCount}
              onStartDateChange={(value) => {
                setStartDate(value);
                const day = Number(value.slice(8, 10));
                if (day) setDayOfMonth(day);
              }}
              onDayOfMonthChange={setDayOfMonth}
            />
          ) : (
            <>
              <label className="block">
                <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Date</span>
                <input name="period_date" type="date" required className={fieldClass} />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Label</span>
                <input name="label" placeholder="e.g. August 15, 2026" className={fieldClass} />
              </label>
            </>
          )}
          <button type="submit" className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary">
            {repeat ? "Create periods" : "Create period"}
          </button>
        </form>
      </Modal>
    </>
  );
}
