import { addMonths, addWeeks, format, lastDayOfMonth, parseISO, setDate } from "date-fns";
import type { BillingPeriod, RecurrenceCadence } from "./types";

const ISO = "yyyy-MM-dd";
const MAX_COUNT = 60;

export const CADENCE_OPTIONS: { value: RecurrenceCadence; label: string }[] = [
  { value: "monthly", label: "Monthly (same day)" },
  { value: "semi_monthly", label: "Semi-monthly (15th & 30th)" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
];

export function isOccurrenceCountCadence(cadence: RecurrenceCadence) {
  return cadence === "weekly" || cadence === "biweekly";
}

export function clampCount(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_COUNT, Math.floor(value)));
}

function toIso(d: Date) {
  return format(d, ISO);
}

function clampDayOfMonth(monthAnchor: Date, day: number) {
  const last = lastDayOfMonth(monthAnchor).getDate();
  return setDate(monthAnchor, Math.min(Math.max(1, day), last));
}

export function generateOccurrenceDates(opts: {
  cadence: RecurrenceCadence;
  startDate: string;
  count: number;
  dayOfMonth?: number;
}): string[] {
  const count = clampCount(opts.count);
  const start = parseISO(opts.startDate);
  if (Number.isNaN(start.getTime())) return [];

  if (opts.cadence === "weekly" || opts.cadence === "biweekly") {
    const weeks = opts.cadence === "weekly" ? 1 : 2;
    return Array.from({ length: count }, (_, i) => toIso(addWeeks(start, i * weeks)));
  }

  const startIso = toIso(start);

  if (opts.cadence === "monthly") {
    const day = opts.dayOfMonth ?? start.getDate();
    const dates: string[] = [];
    for (let i = 0; dates.length < count && i < 120; i++) {
      const iso = toIso(clampDayOfMonth(addMonths(start, i), day));
      if (iso >= startIso) dates.push(iso);
    }
    return dates;
  }

  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const month = addMonths(start, i);
    const fifteenth = toIso(setDate(month, 15));
    const thirtieth = toIso(clampDayOfMonth(month, 30));
    if (fifteenth >= startIso) dates.push(fifteenth);
    if (thirtieth >= startIso && thirtieth !== fifteenth) dates.push(thirtieth);
  }
  return dates;
}

export function matchPeriodsForDates(dates: string[], periods: BillingPeriod[]) {
  const byDate = new Map(periods.map((p) => [p.period_date, p]));
  const existing: BillingPeriod[] = [];
  const missing: string[] = [];
  for (const date of dates) {
    const period = byDate.get(date);
    if (period) existing.push(period);
    else missing.push(date);
  }
  return { existing, missing };
}

export function formatPeriodLabel(period_date: string, label?: string) {
  const custom = label?.trim();
  if (custom) return custom;
  return new Date(`${period_date}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateList(dates: string[], max = 6) {
  const pretty = dates.map((d) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  );
  if (pretty.length <= max) return pretty.join(", ");
  return `${pretty.slice(0, max).join(", ")} +${pretty.length - max} more`;
}
