import type { RecurrenceCadence } from "@/lib/types";
import {
  CADENCE_OPTIONS,
  formatDateList,
  isOccurrenceCountCadence,
} from "@/lib/recurrence";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 min-h-12 text-base outline-none focus:border-primary";

export function RecurrenceFields({
  cadence,
  count,
  startDate,
  dayOfMonth,
  previewDates,
  missingCount,
  onCadenceChange,
  onCountChange,
  onStartDateChange,
  onDayOfMonthChange,
  showStartDate = true,
}: {
  cadence: RecurrenceCadence;
  count: number | null;
  startDate: string;
  dayOfMonth: number;
  previewDates: string[];
  missingCount?: number;
  onCadenceChange: (value: RecurrenceCadence) => void;
  onCountChange: (value: number | null) => void;
  onStartDateChange?: (value: string) => void;
  onDayOfMonthChange?: (value: number) => void;
  showStartDate?: boolean;
}) {
  const countLabel = isOccurrenceCountCadence(cadence) ? "Occurrences" : "Months";

  return (
    <div className="space-y-4">
      {showStartDate ? (
        <label className="block">
          <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Start date</span>
          <input
            type="date"
            required
            value={startDate}
            className={fieldClass}
            onChange={(e) => onStartDateChange?.(e.target.value)}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Repeat every</span>
        <select
          value={cadence}
          className={fieldClass}
          onChange={(e) => onCadenceChange(e.target.value as RecurrenceCadence)}
        >
          {CADENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {cadence === "monthly" && onDayOfMonthChange ? (
        <label className="block">
          <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Day of month</span>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            className={fieldClass}
            onChange={(e) => onDayOfMonthChange(Number(e.target.value) || 1)}
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">{countLabel}</span>
        <input
          name="occurrence_count"
          type="number"
          min={1}
          max={60}
          required
          value={count ?? ""}
          className={fieldClass}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onCountChange(null);
              return;
            }
            const next = Number(raw);
            onCountChange(Number.isFinite(next) ? next : null);
          }}
        />
      </label>
      {previewDates.length > 0 ? (
        <p className="text-sm text-on-surface-variant">
          {previewDates.length} date{previewDates.length === 1 ? "" : "s"}: {formatDateList(previewDates)}
          {missingCount != null && missingCount > 0 ? (
            <>
              . <span className="font-medium text-on-surface">{missingCount} period{missingCount === 1 ? "" : "s"} missing</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
