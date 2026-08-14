import { TransactionRow } from "@/components/transaction-row";
import type { Card, Transaction } from "@/lib/types";

export function TransactionList({
  transactions,
  cardById,
  card,
  showDelete,
}: {
  transactions: Transaction[];
  cardById?: Record<string, Card>;
  card?: Card;
  showDelete?: boolean;
}) {
  return (
    <div>
      {transactions.map((txn) => (
        <TransactionRow
          key={txn.id}
          txn={txn}
          card={card ?? cardById?.[txn.card_id]}
          showDelete={showDelete}
        />
      ))}
    </div>
  );
}
