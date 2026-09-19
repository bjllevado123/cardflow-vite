export type CardBrand = {
  id: string;
  label: string;
  gradient: string;
  swatch: string;
  keywords: string[];
};

export const CARD_BRANDS: CardBrand[] = [
  { id: "bpi", label: "BPI", gradient: "from-[#6b0a0d] via-[#B11116] to-[#d41c22]", swatch: "#B11116", keywords: ["bpi"] },
  { id: "bdo", label: "BDO", gradient: "from-[#00153d] via-[#003DA5] to-[#1658cc]", swatch: "#003DA5", keywords: ["bdo"] },
  { id: "gcash", label: "GCash", gradient: "from-[#0029a3] via-[#0052e0] to-[#007CFF]", swatch: "#007CFF", keywords: ["gcash", "g cash"] },
  { id: "gotyme", label: "GoTyme", gradient: "from-[#070b12] via-[#0d1c36] to-[#1e5bb8]", swatch: "#2B6CB0", keywords: ["gotyme", "go tyme", "tyme"] },
  { id: "shopee", label: "Shopee", gradient: "from-[#b52610] via-[#EE4D2D] to-[#ff6238]", swatch: "#EE4D2D", keywords: ["shopee"] },
  { id: "landbank", label: "Landbank", gradient: "from-[#06351c] via-[#0b6b36] to-[#14964a]", swatch: "#0b6b36", keywords: ["landbank", "lbp"] },
  { id: "unionbank", label: "UnionBank", gradient: "from-[#9a3400] via-[#ef6a00] to-[#ff8a1a]", swatch: "#ef6a00", keywords: ["unionbank", "ubp", "maribank"] },
  { id: "metrobank", label: "Metrobank", gradient: "from-[#1a2744] via-[#243868] to-[#d4a63a]", swatch: "#243868", keywords: ["metrobank"] },
  { id: "maya", label: "Maya", gradient: "from-[#04352c] via-[#00A67E] to-[#1ec89a]", swatch: "#00A67E", keywords: ["maya", "paymaya"] },
  { id: "others", label: "Others", gradient: "from-[#111827] via-[#1f2a3a] to-[#4b5a6e]", swatch: "#475569", keywords: ["others", "other", "cash"] },
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
