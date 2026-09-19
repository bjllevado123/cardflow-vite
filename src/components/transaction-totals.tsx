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
    <section className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-4 sm:py-4">
        <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase sm:text-[11px]">Charges</p>
        <p className="mt-1 text-sm font-semibold text-coral tabular-nums sm:text-xl">{formatPHP(charges)}</p>
      </div>
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-4 sm:py-4">
        <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase sm:text-[11px]">Payments</p>
        <p className="mt-1 text-sm font-semibold text-secondary tabular-nums sm:text-xl">{formatPHP(payments)}</p>
      </div>
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest px-2.5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:px-4 sm:py-4">
        <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase sm:text-[11px]">Balance</p>
        <p className={`mt-1 text-sm font-semibold tabular-nums sm:text-xl ${balance > 0 ? "text-coral" : "text-secondary"}`}>
          {formatPHP(balance)}
        </p>
      </div>
    </section>
  );
}
