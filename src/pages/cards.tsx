import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "@tanstack/react-router";
import { AddCardButton } from "@/components/add-card-form";
import { CardStatusBadge } from "@/components/card-status-badge";
import { CardVisual } from "@/components/card-visual";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPHP } from "@/lib/money";
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
        <section className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {balances.map((b) => (
            <Link
              key={b.card.id}
              to="/cards/$id"
              params={{ id: b.card.id }}
              className="group block min-w-0 hover:-translate-y-0.5"
            >
              <div className="relative">
                <CardVisual
                  name={b.card.name}
                  holder={name}
                  lastFour={b.card.last_four}
                  balance={b.balance}
                  color={b.card.color}
                  compact
                  className="max-w-none"
                />
                <span className="absolute right-2 top-2">
                  <CardStatusBadge balance={b.balance} onCard />
                </span>
              </div>
              <p className="mt-2 truncate text-[11px] text-on-surface-variant">
                <span className="tabular-nums text-coral">{formatPHP(b.charges)}</span>
                {" in · "}
                <span className="tabular-nums text-secondary">{formatPHP(b.payments)}</span>
                {" out"}
              </p>
            </Link>
          ))}
          <AddCardButton holder={name} variant="tile" />
        </section>
      )}
    </>
  );
}
