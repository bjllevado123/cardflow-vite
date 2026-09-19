export type CardBrand = {
  id: string;
  label: string;
  gradient: string;
  swatch: string;
  keywords: string[];
};

export const CARD_BRANDS: CardBrand[] = [
  { id: "bpi", label: "BPI", gradient: "from-[#e86a6e] via-[#B11116] to-[#ff8a8a]", swatch: "#B11116", keywords: ["bpi"] },
  { id: "bdo", label: "BDO", gradient: "from-[#4f8ef0] via-[#003DA5] to-[#7eb4ff]", swatch: "#003DA5", keywords: ["bdo"] },
  { id: "gcash", label: "GCash", gradient: "from-[#4da3ff] via-[#007CFF] to-[#9ad0ff]", swatch: "#007CFF", keywords: ["gcash", "g cash"] },
  { id: "gotyme", label: "GoTyme", gradient: "from-[#3d5a80] via-[#1a3a66] to-[#6ea0e6]", swatch: "#2B6CB0", keywords: ["gotyme", "go tyme", "tyme"] },
  { id: "shopee", label: "Shopee", gradient: "from-[#ff7a5c] via-[#EE4D2D] to-[#ffb08a]", swatch: "#EE4D2D", keywords: ["shopee"] },
  { id: "landbank", label: "Landbank", gradient: "from-[#3cb56a] via-[#0b6b36] to-[#7ee0a2]", swatch: "#0b6b36", keywords: ["landbank", "lbp"] },
  { id: "unionbank", label: "UnionBank", gradient: "from-[#ff9a4a] via-[#ef6a00] to-[#ffc88a]", swatch: "#ef6a00", keywords: ["unionbank", "ubp", "maribank"] },
  { id: "metrobank", label: "Metrobank", gradient: "from-[#4a5f8c] via-[#243868] to-[#f0c14b]", swatch: "#243868", keywords: ["metrobank"] },
  { id: "maya", label: "Maya", gradient: "from-[#2fd4a6] via-[#00A67E] to-[#8ef0d0]", swatch: "#00A67E", keywords: ["maya", "paymaya"] },
  { id: "others", label: "Others", gradient: "from-[#7b8798] via-[#475569] to-[#c5d0dc]", swatch: "#475569", keywords: ["others", "other", "cash"] },
];

const FALLBACK = CARD_BRANDS.find((b) => b.id === "others")!;

export function resolveCardBrand(nameOrColor?: string | null): CardBrand {
  const key = (nameOrColor ?? "").trim().toLowerCase();
  if (!key) return FALLBACK;
  const byId = CARD_BRANDS.find((b) => b.id === key);
  if (byId) return byId;
  const byKeyword = CARD_BRANDS.find((b) => b.keywords.some((k) => key === k || key.includes(k)));
  return byKeyword ?? FALLBACK;
}

export function resolveCardBrandFromCard(name: string, color?: string | null): CardBrand {
  const key = name.trim().toLowerCase();
  const byKeyword = CARD_BRANDS.find((b) => b.keywords.some((k) => key === k || key.includes(k)));
  if (byKeyword) return byKeyword;
  if (color) return resolveCardBrand(color);
  return FALLBACK;
}

function namedBrandIndex(name: string, color?: string | null): number {
  const brand = resolveCardBrandFromCard(name, color);
  return CARD_BRANDS.findIndex((b) => b.id === brand.id);
}

/** The catch-all Others wallet — not every unmatched custom name. */
export function isOthersCard(name: string, color?: string | null): boolean {
  const key = name.trim().toLowerCase();
  const known = CARD_BRANDS.find(
    (b) => b.id !== "others" && b.keywords.some((k) => key === k || key.includes(k)),
  );
  if (known) return false;
  return key === "others" || key === "other" || color === "others";
}

export function sortCards<T extends { name: string; color?: string | null; sort_order?: number }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const aLast = isOthersCard(a.name, a.color);
    const bLast = isOthersCard(b.name, b.color);
    if (aLast !== bLast) return aLast ? 1 : -1;
    const rank = namedBrandIndex(a.name, a.color) - namedBrandIndex(b.name, b.color);
    if (rank) return rank;
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order) return order;
    return a.name.localeCompare(b.name);
  });
}
