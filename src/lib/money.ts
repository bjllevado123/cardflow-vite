const phpCurrency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const phpGrouped = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPHP(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return phpCurrency.format(n);
}

function compactAmountText(value: string) {
  return value.toLowerCase().replace(/[₱,\s+\-]/g, "");
}

export function amountMatchesQuery(amount: number, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;
  const compact = compactAmountText(trimmed);
  if (!compact) return false;

  const abs = Math.abs(Number.isFinite(amount) ? amount : 0);
  if (/^\d+(\.\d+)?$/.test(compact) && Number(compact) === abs) return true;

  const grouped = phpGrouped.format(abs);
  const haystacks = [String(abs), abs.toFixed(2), grouped, grouped.replace(/,/g, ""), phpCurrency.format(abs)];
  return haystacks.some((h) => {
    const lower = h.toLowerCase();
    return lower.includes(trimmed) || compactAmountText(h).includes(compact);
  });
}

export function formatSignedPHP(amount: number, type: "charge" | "payment"): string {
  const abs = formatPHP(Math.abs(amount));
  return type === "payment" ? `+${abs}` : `-${abs}`;
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
