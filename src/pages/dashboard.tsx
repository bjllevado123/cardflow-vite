import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import { Link } from "@tanstack/react-router";
import { CardVisual } from "@/components/card-visual";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPHP, roundMoney } from "@/lib/money";
import { computeBalances } from "@/lib/summaries";

export function DashboardPage() {
  const { user } = useAuth();
  const cards = useLiveQuery(() => db.cards.toArray()) ?? [];
  const periods = useLiveQuery(() => db.periods.orderBy("period_date").reverse().toArray()) ?? [];
  const transactions = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "You";

  const balances = computeBalances(cards, transactions);
  const totalBalance = roundMoney(balances.reduce((s, b) => s + b.balance, 0));
  const totalCharges = roundMoney(balances.reduce((s, b) => s + b.charges, 0));
  const totalPayments = roundMoney(balances.reduce((s, b) => s + b.payments, 0));
  const totalLimit = cards.reduce((s, c) => s + (Number(c.credit_limit) || 0), 0);
  const utilization = totalLimit > 0 ? Math.min(100, Math.round((totalBalance / totalLimit) * 100)) : null;
  const featured = [...balances].sort((a, b) => b.balance - a.balance)[0];
  const periodIds = new Set(periods.slice(0, 6).map((p) => p.id));
  const periodSpend = periods
    .slice(0, 6)
    .reverse()
    .map((p) => ({
      id: p.id,
      label: p.label.replace(/,?\s*20\d{2}/, "").trim(),
      spend: transactions
        .filter((t) => t.type === "charge" && t.billing_period_id === p.id && periodIds.has(p.id))
        .reduce((s, t) => s + Number(t.amount), 0),
    }));
  const maxSpend = Math.max(...periodSpend.map((p) => p.spend), 1);
  const upcoming = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);
  const recent = [...transactions]
    .sort((a, b) => (b.txn_date ?? "").localeCompare(a.txn_date ?? "") || b.created_at.localeCompare(a.created_at))
    .slice(0, 4);
  const nextPeriod = periods[0];

  return (
    <>
      <PageHeader
        title="Overview"
        description={nextPeriod ? `Latest period · ${nextPeriod.label}` : "Track charges, payments, and pay everything down to ₱0."}
        actions={<TransactionForm cards={cards} periods={periods} trigger="header" />}
      />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
        <div className="glass-panel flex min-h-[168px] flex-col justify-between rounded-2xl border border-outline-variant/30 p-6 md:col-span-8">
          <div>
            <p className="mb-1 text-sm text-on-surface-variant">Total balance</p>
            <h2 className="text-4xl font-bold tracking-tight tabular-nums md:text-5xl">{formatPHP(totalBalance)}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Goal: ₱0.00 across all cards</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">Charges</p>
              <p className="mt-0.5 font-semibold text-coral tabular-nums">{formatPHP(totalCharges)}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">Payments</p>
              <p className="mt-0.5 font-semibold text-secondary tabular-nums">{formatPHP(totalPayments)}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">Cards</p>
              <p className="mt-0.5 font-semibold tabular-nums">{cards.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-outline-variant/30 p-6 md:col-span-4">
          <div>
            <p className="mb-1 text-sm text-on-surface-variant">Utilization</p>
            <h3 className="text-3xl font-semibold">{utilization === null ? "—" : `${utilization}%`}</h3>
          </div>
          <div className="mt-6 w-full">
            <div className="mb-2 flex justify-between text-[11px] font-bold tracking-[0.06em] text-on-surface-variant uppercase">
              <span>{formatPHP(Math.max(totalBalance, 0))}</span>
              <span>{totalLimit > 0 ? formatPHP(totalLimit) : "No limit"}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-secondary progress-glow" style={{ width: `${utilization ?? 0}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        <div className="flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Highest balance</h3>
            <Link to="/cards" className="text-sm font-semibold text-secondary">
              All cards
            </Link>
          </div>
          <div className="flex min-h-[220px] flex-1 items-center justify-center">
            {featured ? (
              <CardVisual name={featured.card.name} holder={name} lastFour={featured.card.last_four} balance={featured.balance} color={featured.card.color} />
            ) : (
              <p className="text-sm text-on-surface-variant">Add a card to get started.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Spend by period</h3>
            <span className="text-xs font-bold tracking-wide text-on-surface-variant uppercase">Charges</span>
          </div>
          {periodSpend.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No billing periods yet.</p>
          ) : (
            <div className="flex min-h-[180px] flex-1 items-end justify-around gap-2 border-b border-outline-variant pb-6">
              {periodSpend.map((p) => (
                <div key={p.id} className="group flex max-w-[52px] flex-1 flex-col items-center gap-2" title={formatPHP(p.spend)}>
                  <div className="w-full rounded-t-md bg-secondary/85 progress-glow" style={{ height: `${Math.max(10, (p.spend / maxSpend) * 140)}px` }} />
                  <span className="text-center text-[10px] font-bold tracking-wide text-on-surface-variant">{p.label.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <h3 className="mb-4 text-lg font-semibold">Open balances</h3>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">All clear — every card is at ₱0.</p>
          ) : (
            upcoming.map((b) => (
              <div key={b.card.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{b.card.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {formatPHP(b.charges)} charged · {formatPHP(b.payments)} paid
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">{formatPHP(b.balance)}</p>
              </div>
            ))
          )}
        </div>
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent activity</h3>
            <Link to="/transactions" search={{ q: undefined, card: undefined, period: undefined, sort: undefined }} className="text-sm font-semibold text-secondary">
              View all
            </Link>
          </div>
          {recent.map((t) => {
            const card = cards.find((c) => c.id === t.card_id);
            return (
              <Link
                key={t.id}
                to="/transactions/$id"
                params={{ id: t.id }}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-surface-container-high/30"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.notes || (t.type === "payment" ? "Payment" : "Charge")}</p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {card?.name ?? "Card"}
                    {t.txn_date ? ` · ${t.txn_date}` : ""}
                  </p>
                </div>
                <p className={`shrink-0 font-semibold tabular-nums ${t.type === "payment" ? "text-secondary" : "text-coral"}`}>
                  {t.type === "payment" ? "+" : "-"}
                  {formatPHP(Number(t.amount))}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
      {periods[0] ? (
        <p className="pb-2 text-xs text-on-surface-variant">
          Synced with {format(parseISO(periods[0].period_date), "MMM d, yyyy")} period data
        </p>
      ) : null}
    </>
  );
}
