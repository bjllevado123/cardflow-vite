export function formatPHP(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatSignedPHP(amount: number, type: "charge" | "payment"): string {
  const abs = formatPHP(Math.abs(amount));
  return type === "payment" ? `+${abs}` : `-${abs}`;
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
