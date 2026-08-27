import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { db, deleteTransaction } from "@/lib/db";
import { formatSignedPHP } from "@/lib/money";

function formatDay(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso.slice(0, 10)), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function formatLoggedAt(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
}

export function TransactionDetailPage() {
  const { id } = useParams({ from: "/transactions/$id" });
  const navigate = useNavigate();
  const txn = useLiveQuery(async () => (await db.transactions.get(id)) ?? null, [id]);
  const card = useLiveQuery(() => (txn ? db.cards.get(txn.card_id) : undefined), [txn?.card_id]);
  const period = useLiveQuery(() => (txn ? db.periods.get(txn.billing_period_id) : undefined), [txn?.billing_period_id]);

  if (txn === undefined) {
    return <p className="text-sm text-on-surface-variant">Loading…</p>;
  }

  if (txn === null) {
    return (
      <>
        <div className="mb-2">
          <Link
            to="/transactions"
            search={{ q: undefined, card: undefined, period: undefined, sort: undefined }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Transactions
          </Link>
        </div>
        <p className="text-sm text-on-surface-variant">Transaction not found.</p>
      </>
    );
  }

  const isPayment = txn.type === "payment";
  const title = txn.notes || (isPayment ? "Payment" : "Charge");

  return (
    <>
      <div className="mb-2">
        <Link
          to="/transactions"
          search={{ q: undefined, card: undefined, period: txn.billing_period_id, sort: undefined }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Transactions
        </Link>
      </div>
      <PageHeader
        title={title}
        description={`${isPayment ? "Payment" : "Charge"} · ${txn.frequency === "recurring" ? "Recurring" : "One-time"}`}
      />
      <section className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest">
        <div className="border-b border-outline-variant/50 px-5 py-5 md:px-6">
          <p className="text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">Amount</p>
          <p className={`mt-1 text-3xl font-semibold tabular-nums ${isPayment ? "text-secondary" : "text-coral"}`}>
            {formatSignedPHP(Number(txn.amount), txn.type)}
          </p>
        </div>
        <dl className="divide-y divide-outline-variant/50">
          <DetailRow label="Card">
            {card ? (
              <Link to="/cards/$id" params={{ id: card.id }} className="font-semibold text-secondary">
                {card.name}
              </Link>
            ) : (
              <span>Unknown card</span>
            )}
          </DetailRow>
          <DetailRow label="Period">
            {period ? (
              <Link
                to="/transactions"
                search={{ q: undefined, card: undefined, period: period.id, sort: undefined }}
                className="font-semibold text-secondary"
              >
                {period.label}
              </Link>
            ) : (
              <span>{txn.billing_period_id}</span>
            )}
          </DetailRow>
          <DetailRow label="Date">{formatDay(txn.txn_date)}</DetailRow>
          <DetailRow label="Logged at">{formatLoggedAt(txn.created_at)}</DetailRow>
          <DetailRow label="Type">{isPayment ? "Payment" : "Charge"}</DetailRow>
          <DetailRow label="Frequency">{txn.frequency === "recurring" ? "Recurring" : "One-time"}</DetailRow>
          {txn.notes ? <DetailRow label="Note">{txn.notes}</DetailRow> : null}
        </dl>
      </section>
      <button
        type="button"
        className="min-h-12 w-full rounded-xl border border-outline-variant text-sm font-semibold text-error"
        onClick={() => {
          void deleteTransaction(txn.id).then(() => {
            toast.success("Entry deleted");
            void navigate({
              to: "/transactions",
              search: { q: undefined, card: undefined, period: txn.billing_period_id, sort: undefined },
            });
          });
        }}
      >
        Delete
      </button>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 md:px-6">
      <dt className="shrink-0 text-[12px] font-bold tracking-[0.08em] text-on-surface-variant uppercase">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold">{children}</dd>
    </div>
  );
}
