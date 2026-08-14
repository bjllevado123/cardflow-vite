import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "@tanstack/react-router";
import { AddCardButton } from "@/components/add-card-form";
import { CardStatusBadge } from "@/components/card-status-badge";
import { CardVisual } from "@/components/card-visual";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";
import { computeBalances } from "@/lib/summaries";

export function CardsPage() {
  const { user } = useAuth();
  const cards = useLiveQuery(() => db.cards.toArray()) ?? [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "You";
  const balances = computeBalances(cards, transactions);
  const totalBalance = balances.reduce((s, b) => s + b.balance, 0);

  return (
    <>
      <PageHeader
        title="My Cards"
        description={`${cards.length} account${cards.length === 1 ? "" : "s"} · ${formatPHP(totalBalance)} open balance`}
        actions={<AddCardButton holder={name} label="Add card" />}
      />
      {balances.length === 0 ? (
        <EmptyState
          icon="credit_card"
          title="No cards yet"
          description="Add BPI, BDO, GCash, or any wallet so you can track balances like your Excel Overall sheet."
          action={<AddCardButton holder={name} label="Add your first card" />}
        />
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {balances.map((b) => {
            const brand = resolveCardBrandFromCard(b.card.name, b.card.color);
            return (
              <Link
                key={b.card.id}
                to="/cards/$id"
                params={{ id: b.card.id }}
                className="group relative block rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] hover:-translate-y-0.5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: brand.swatch }} />
                    <h3 className="truncate font-semibold">{b.card.name}</h3>
                  </div>
                  <CardStatusBadge balance={b.balance} />
                </div>
                <CardVisual name={b.card.name} holder={name} lastFour={b.card.last_four} balance={b.balance} color={b.card.color} compact />
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-surface-container-low px-2 py-3">
                    <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Charges</p>
                    <p className="mt-1 text-sm font-semibold text-coral tabular-nums">{formatPHP(b.charges)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low px-2 py-3">
                    <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Payments</p>
                    <p className="mt-1 text-sm font-semibold text-secondary tabular-nums">{formatPHP(b.payments)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-container-low px-2 py-3">
                    <p className="text-[10px] font-bold tracking-wide text-on-surface-variant uppercase">Balance</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">{formatPHP(b.balance)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
          <AddCardButton holder={name} variant="tile" />
        </section>
      )}
    </>
  );
}
