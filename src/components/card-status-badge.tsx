import { roundMoney } from "@/lib/money";

export function CardStatusBadge({ balance }: { balance: number }) {
  const amount = roundMoney(Number(balance));
  const status = amount === 0 ? "paid_off" : amount < 0 ? "overpaid" : "open";
  const styles = {
    paid_off: { label: "Paid off", className: "text-on-secondary-container bg-secondary-container" },
    overpaid: { label: "Overpaid", className: "text-secondary bg-secondary-container/70" },
    open: { label: "Open", className: "text-on-surface-variant bg-surface-container-high" },
  }[status];
  return (
    <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full ${styles.className}`}>
      {styles.label}
    </span>
  );
}
