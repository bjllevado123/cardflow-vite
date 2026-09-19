import { roundMoney } from "@/lib/money";

export function CardStatusBadge({ balance, onCard }: { balance: number; onCard?: boolean }) {
  const amount = roundMoney(Number(balance));
  const status = amount === 0 ? "paid_off" : amount < 0 ? "overpaid" : "open";
  const styles = {
    paid_off: { label: "Paid off", className: onCard ? "text-white bg-white/20" : "text-on-secondary-container bg-secondary-container" },
    overpaid: { label: "Overpaid", className: onCard ? "text-white bg-white/20" : "text-secondary bg-secondary-container/70" },
    open: { label: "Open", className: onCard ? "text-white bg-white/18" : "text-on-surface-variant bg-surface-container-high" },
  }[status];
  return (
    <span
      className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full ${styles.className} ${
        onCard ? "ring-1 ring-white/35 backdrop-blur-sm" : ""
      }`}
    >
      {styles.label}
    </span>
  );
}
