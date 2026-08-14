import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { TransactionTotals } from "@/components/transaction-totals";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { db, getDefaultPeriodFilter } from "@/lib/db";
import { findClosestNextPeriod } from "@/lib/period-preference";
import { filterTransactions, sumTransactions } from "@/lib/summaries";

export function TransactionsPage() {
  const search = useSearch({ from: "/transactions" });
  const navigate = useNavigate({ from: "/transactions" });
  const cards = useLiveQuery(() => db.cards.toArray()) ?? [];
  const periods = useLiveQuery(() => db.periods.orderBy("period_date").reverse().toArray()) ?? [];
  const allTxns = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const [q, setQ] = useState(search.q ?? "");

  useEffect(() => {
    setQ(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    if (search.period !== undefined || periods.length === 0) return;
    void getDefaultPeriodFilter().then((pref) => {
      if (pref !== "closest_next") {
        void navigate({ search: (prev) => ({ ...prev, period: "all" }), replace: true });
        return;
      }
      const next = findClosestNextPeriod(periods);
      if (next) void navigate({ search: (prev) => ({ ...prev, period: next.id }), replace: true });
    });
  }, [search.period, periods, navigate]);

  const periodId = !search.period || search.period === "all" ? undefined : search.period;
  const cardId = search.card || undefined;
  const filtered = useMemo(
    () =>
      filterTransactions(allTxns, { periodId, cardId, q: search.q }).sort(
        (a, b) => (b.txn_date ?? "").localeCompare(a.txn_date ?? "") || b.created_at.localeCompare(a.created_at),
      ),
    [allTxns, periodId, cardId, search.q],
  );
  const totals = sumTransactions(filtered);
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]));

  function patch(next: { q?: string; card?: string; period?: string }) {
    void navigate({
      search: (prev) => ({
        q: next.q !== undefined ? next.q || undefined : prev.q,
        card: next.card !== undefined ? next.card || undefined : prev.card,
        period: next.period !== undefined ? next.period : prev.period,
      }),
      replace: true,
    });
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Search and filter charges & payments across periods."
        actions={<TransactionForm cards={cards} periods={periods} defaultPeriodId={periodId} trigger="header" />}
      />
      <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
          <input
            value={q}
            placeholder="Search notes…"
            className="min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary md:col-span-5"
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);
              patch({ q: value });
            }}
          />
          <select
            value={cardId ?? ""}
            className="min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 md:col-span-3"
            onChange={(e) => patch({ card: e.target.value })}
          >
            <option value="">All cards</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={search.period ?? "all"}
            className="min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 md:col-span-3"
            onChange={(e) => patch({ period: e.target.value })}
          >
            <option value="all">All periods</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="min-h-12 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant md:col-span-1"
            onClick={() => {
              setQ("");
              void navigate({ search: { q: undefined, card: undefined, period: "all" }, replace: true });
            }}
          >
            Clear
          </button>
        </div>
      </section>

      <TransactionTotals charges={totals.charges} payments={totals.payments} balance={totals.balance} />

      <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low/40 px-5 py-4 md:px-6">
          <div>
            <h3 className="font-semibold">Activity</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">{filtered.length} shown</p>
          </div>
          <Link to="/periods" className="text-sm font-semibold text-secondary">
            By period →
          </Link>
        </div>
        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon="receipt_long" title="No matching transactions" description="Try clearing filters, or add a charge / payment." />
          </div>
        ) : (
          <TransactionList transactions={filtered} cardById={cardMap} showDelete />
        )}
      </section>
    </>
  );
}
