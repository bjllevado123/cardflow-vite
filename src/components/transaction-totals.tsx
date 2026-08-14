import { formatPHP } from "@/lib/money";

export function TransactionTotals({
  charges,
  payments,
  balance,
}: {
  charges: number;
  payments: number;
  balance: number;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-bold tracking-wide text-on-surface-variant uppercase">Charges</p>
        <p className="mt-1 text-xl font-semibold text-coral tabular-nums">{formatPHP(charges)}</p>
      </div>
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-bold tracking-wide text-on-surface-variant uppercase">Payments</p>
        <p className="mt-1 text-xl font-semibold text-secondary tabular-nums">{formatPHP(payments)}</p>
      </div>
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-bold tracking-wide text-on-surface-variant uppercase">Open balance</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums ${balance > 0 ? "text-coral" : "text-secondary"}`}>
          {formatPHP(balance)}
        </p>
      </div>
    </section>
  );
}
