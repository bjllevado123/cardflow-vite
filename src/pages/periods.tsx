import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import { AddPeriodButton } from "@/components/add-period-form";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { formatPHP } from "@/lib/money";
import { periodTotals } from "@/lib/summaries";

export function PeriodsPage() {
  const periods = useLiveQuery(() => db.periods.orderBy("period_date").reverse().toArray()) ?? [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const rows = periods.map((p) => periodTotals(p, transactions));

  return (
    <>
      <PageHeader
        title="Periods"
        description="Billing cycles like Excel tabs — June 15, June 30, and so on."
        actions={<AddPeriodButton />}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="calendar_month"
          title="No periods yet"
          description="Create your first 15th or 30th billing period to start logging entries."
          action={<AddPeriodButton />}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="hidden grid-cols-12 gap-3 border-b border-outline-variant/50 bg-surface-container-low/50 px-5 py-3 text-[11px] font-bold tracking-wide text-on-surface-variant uppercase sm:grid">
            <span className="col-span-5">Period</span>
            <span className="col-span-2 text-right">Entries</span>
            <span className="col-span-2 text-right">Charges</span>
            <span className="col-span-2 text-right">Payments</span>
            <span className="col-span-1 text-right">Bal</span>
          </div>
          {rows.map((r) => (
            <Link
              key={r.period.id}
              to="/transactions"
              search={{ q: undefined, card: undefined, period: r.period.id, sort: undefined }}
              className="grid grid-cols-1 items-center gap-1 border-b border-outline-variant/40 px-5 py-4 last:border-0 hover:bg-surface-container-low/70 sm:grid-cols-12 sm:gap-3"
            >
              <div className="min-w-0 sm:col-span-5">
                <p className="truncate font-semibold">{r.period.label}</p>
                <p className="text-sm text-on-surface-variant">{format(parseISO(r.period.period_date), "MMM d, yyyy")}</p>
              </div>
              <p className="text-sm text-on-surface-variant sm:col-span-2 sm:text-right">{r.count}</p>
              <p className="text-sm font-medium text-coral tabular-nums sm:col-span-2 sm:text-right">{formatPHP(r.charges)}</p>
              <p className="text-sm font-medium text-secondary tabular-nums sm:col-span-2 sm:text-right">{formatPHP(r.payments)}</p>
              <p className="text-sm font-semibold tabular-nums sm:col-span-1 sm:text-right">{formatPHP(r.balance)}</p>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
