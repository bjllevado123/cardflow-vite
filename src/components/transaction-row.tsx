import { formatPHP, formatSignedPHP } from "@/lib/money";
import { deleteTransaction } from "@/lib/db";
import type { Card, Transaction } from "@/lib/types";
import { toast } from "sonner";

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
  return (
    <div className="txn-row-deferred flex items-center justify-between p-4 md:p-6 border-b border-outline-variant/50 hover:bg-surface-container-high/30 group">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isPayment
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-surface-container-high text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined">{iconFor(txn.notes, txn.type)}</span>
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{txn.notes || (isPayment ? "Payment" : "Charge")}</div>
          <div className="text-sm text-on-surface-variant mt-1 truncate">
            {card?.name ?? "Card"} • {txn.frequency === "recurring" ? "Recurring" : "One-time"}
            {txn.txn_date ? ` • ${txn.txn_date}` : ""}
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 pl-3">
        <div className={`font-semibold tabular-nums ${isPayment ? "text-secondary" : "text-coral"}`}>
          {formatSignedPHP(Number(txn.amount), txn.type)}
        </div>
        {showDelete ? (
          <button
            type="button"
            className="mt-1 text-xs text-on-surface-variant hover:text-error"
            onClick={() => {
              void deleteTransaction(txn.id).then(() => toast.success("Entry deleted"));
            }}
          >
            Delete
          </button>
        ) : (
          <div className="text-sm text-on-surface-variant mt-1">{formatPHP(Number(txn.amount))}</div>
        )}
      </div>
    </div>
  );
}
