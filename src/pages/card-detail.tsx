import { Link, useParams } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CardStatusBadge } from "@/components/card-status-badge";
import { CardVisual } from "@/components/card-visual";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";
import { computeBalances } from "@/lib/summaries";

export function CardDetailPage() {
  const { id } = useParams({ from: "/cards/$id" });
  const { user } = useAuth();
  const card = useLiveQuery(() => db.cards.get(id), [id]);
  const periods = useLiveQuery(() => db.periods.orderBy("period_date").reverse().toArray()) ?? [];
  const transactions = useLiveQuery(() => db.transactions.where("card_id").equals(id).toArray(), [id]) ?? [];
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "You";

  if (!card) {
    return <p className="text-sm text-on-surface-variant">Card not found.</p>;
  }

  const [balance] = computeBalances([card], transactions);
  const brand = resolveCardBrandFromCard(card.name, card.color);
  const sorted = [...transactions].sort(
    (a, b) => (b.txn_date ?? "").localeCompare(a.txn_date ?? "") || b.created_at.localeCompare(a.created_at),
  );

  return (
    <>
      <div className="mb-2">
        <Link to="/cards" className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          My Cards
        </Link>
      </div>
      <PageHeader
        title={card.name}
        description={`${formatPHP(balance.balance)} balance · ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`}
        actions={<TransactionForm cards={[card]} periods={periods} defaultCardId={card.id} trigger="header" />}
      />
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start md:gap-6">
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: brand.swatch }} />
                <h3 className="truncate font-semibold">{card.name}</h3>
              </div>
              <CardStatusBadge balance={balance.balance} />
            </div>
            <CardVisual name={card.name} holder={name} lastFour={card.last_four} balance={balance.balance} color={card.color} />
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-container-low px-2 py-3">
                <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Charges</p>
                <p className="mt-1 text-sm font-semibold text-coral tabular-nums">{formatPHP(balance.charges)}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low px-2 py-3">
                <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Payments</p>
                <p className="mt-1 text-sm font-semibold text-secondary tabular-nums">{formatPHP(balance.payments)}</p>
              </div>
              <div className="rounded-xl bg-surface-container-low px-2 py-3">
                <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Balance</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{formatPHP(balance.balance)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low/40 px-5 py-4">
              <div>
                <h3 className="font-semibold">Activity</h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">All charges & payments on this card</p>
              </div>
              <Link to="/transactions" search={{ q: undefined, card: card.id, period: "all" }} className="text-sm font-semibold text-secondary">
                In Transactions →
              </Link>
            </div>
            {sorted.length === 0 ? (
              <div className="p-4">
                <EmptyState icon="receipt_long" title="No transactions yet" description="Add a charge or payment for this card to start tracking." />
              </div>
            ) : (
              <TransactionList transactions={sorted} card={card} showDelete />
            )}
          </section>
        </div>
      </section>
    </>
  );
}
