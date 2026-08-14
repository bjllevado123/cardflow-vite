export type CardBrand = {
  id: string;
  label: string;
  gradient: string;
  swatch: string;
  keywords: string[];
};

export const CARD_BRANDS: CardBrand[] = [
  { id: "bpi", label: "BPI", gradient: "from-[#7a0b0e] via-[#B11116] to-[#d41a20]", swatch: "#B11116", keywords: ["bpi"] },
  { id: "bdo", label: "BDO", gradient: "from-[#00205B] via-[#003DA5] to-[#0057B8]", swatch: "#003DA5", keywords: ["bdo"] },
  { id: "gcash", label: "GCash", gradient: "from-[#002CB8] via-[#0052e0] to-[#007CFF]", swatch: "#007CFF", keywords: ["gcash", "g cash"] },
  { id: "gotyme", label: "GoTyme", gradient: "from-[#0B1220] via-[#14325c] to-[#2B6CB0]", swatch: "#2B6CB0", keywords: ["gotyme", "go tyme", "tyme"] },
  { id: "shopee", label: "Shopee", gradient: "from-[#c23a1f] via-[#EE4D2D] to-[#ff6a45]", swatch: "#EE4D2D", keywords: ["shopee"] },
  { id: "maya", label: "Maya", gradient: "from-[#0a1f1a] via-[#00A67E] to-[#2dd4a8]", swatch: "#00A67E", keywords: ["maya", "paymaya"] },
  { id: "others", label: "Others", gradient: "from-[#1e293b] via-[#334155] to-[#64748b]", swatch: "#475569", keywords: ["others", "other", "cash"] },
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
