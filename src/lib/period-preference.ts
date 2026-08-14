import type { BillingPeriod } from "@/lib/types";

export function findClosestNextPeriod(
  periods: BillingPeriod[],
  today = new Date(),
): BillingPeriod | null {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  const upcoming = periods
    .filter((p) => p.period_date >= todayStr)
    .sort((a, b) => a.period_date.localeCompare(b.period_date));
  return upcoming[0] ?? null;
}
