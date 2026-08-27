import type { BillingPeriod, Card, Transaction } from "./types";
import { amountMatchesQuery, roundMoney } from "./money";

export function computeBalances(cards: Card[], transactions: Pick<Transaction, "card_id" | "type" | "amount">[]) {
  const byCard = new Map<string, { charges: number; payments: number }>();
  for (const t of transactions) {
    const row = byCard.get(t.card_id) ?? { charges: 0, payments: 0 };
    const amount = Number(t.amount);
    if (t.type === "charge") row.charges += amount;
    else if (t.type === "payment") row.payments += amount;
    byCard.set(t.card_id, row);
  }
  return cards.map((card) => {
    const row = byCard.get(card.id) ?? { charges: 0, payments: 0 };
    const charges = roundMoney(row.charges);
    const payments = roundMoney(row.payments);
    return { card, charges, payments, balance: roundMoney(charges - payments) };
  });
}

export function sumTransactions(transactions: Pick<Transaction, "type" | "amount">[]) {
  let charges = 0;
  let payments = 0;
  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.type === "charge") charges += amount;
    else if (t.type === "payment") payments += amount;
  }
  return {
    charges: roundMoney(charges),
    payments: roundMoney(payments),
    balance: roundMoney(charges - payments),
  };
}

export function filterTransactions(
  transactions: Transaction[],
  opts: { periodId?: string; cardId?: string; q?: string },
) {
  const raw = (opts.q ?? "").trim();
  const q = raw.toLowerCase();
  return transactions.filter((t) => {
    if (opts.periodId && t.billing_period_id !== opts.periodId) return false;
    if (opts.cardId && t.card_id !== opts.cardId) return false;
    if (q) {
      const notesHit = (t.notes ?? "").toLowerCase().includes(q);
      if (!notesHit && !amountMatchesQuery(Number(t.amount), raw)) return false;
    }
    return true;
  });
}

export function periodTotals(period: BillingPeriod, transactions: Transaction[]) {
  const txns = transactions.filter((t) => t.billing_period_id === period.id);
  const sums = sumTransactions(txns);
  return { period, count: txns.length, ...sums };
}

export type CreatedSort = "newest" | "oldest";

export function sortTransactionsByCreated(transactions: Transaction[], sort: CreatedSort = "newest") {
  const dir = sort === "oldest" ? 1 : -1;
  return [...transactions].sort((a, b) => {
    const created = a.created_at.localeCompare(b.created_at);
    if (created) return created * dir;
    return (a.txn_date ?? "").localeCompare(b.txn_date ?? "") * dir;
  });
}
