import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatPHP, formatSignedPHP } from "@/lib/money";
import { deleteTransaction } from "@/lib/db";
import type { Card, Transaction } from "@/lib/types";

function iconFor(notes: string | null, type: string) {
  const n = (notes ?? "").toLowerCase();
  if (type === "payment") return "payments";
  if (n.includes("gas") || n.includes("shell") || n.includes("seaoil")) return "local_gas_station";
  if (n.includes("flight") || n.includes("cebu")) return "flight";
  if (n.includes("grocery") || n.includes("mcdo") || n.includes("food")) return "restaurant";
  if (n.includes("shop") || n.includes("shopee")) return "shopping_bag";
  return "receipt_long";
}

export function TransactionRow({
  txn,
  card,
  showDelete,
}: {
  txn: Transaction;
  card?: Card;
  showDelete?: boolean;
}) {
  const isPayment = txn.type === "payment";
  const title = txn.notes || (isPayment ? "Payment" : "Charge");
  return (
    <div className="txn-row-deferred flex items-stretch border-b border-outline-variant/50 hover:bg-surface-container-high/30 group">
      <Link
        to="/transactions/$id"
        params={{ id: txn.id }}
        aria-label={`${title}, ${card?.name ?? "card"}`}
        className="flex min-w-0 flex-1 items-center justify-between p-4 md:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isPayment
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-surface-container-high text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined">{iconFor(txn.notes, txn.type)}</span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{title}</div>
            <div className="mt-1 truncate text-sm text-on-surface-variant">
              {card?.name ?? "Card"} • {txn.frequency === "recurring" ? "Recurring" : "One-time"}
              {txn.txn_date ? ` • ${txn.txn_date}` : ""}
            </div>
          </div>
        </div>
        <div className="shrink-0 pl-3 text-right">
          <div className={`font-semibold tabular-nums ${isPayment ? "text-secondary" : "text-coral"}`}>
            {formatSignedPHP(Number(txn.amount), txn.type)}
          </div>
          {showDelete ? null : <div className="mt-1 text-sm text-on-surface-variant">{formatPHP(Number(txn.amount))}</div>}
        </div>
      </Link>
      {showDelete ? (
        <button
          type="button"
          className="shrink-0 self-center px-4 text-xs font-semibold text-on-surface-variant hover:text-error"
          onClick={() => {
            void deleteTransaction(txn.id).then(() => toast.success("Entry deleted"));
          }}
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
