export type CardBrand = {
  id: string;
  label: string;
  gradient: string;
  swatch: string;
  keywords: string[];
};

export const CARD_BRANDS: CardBrand[] = [
  { id: "bpi", label: "BPI", gradient: "from-[#5a070a] via-[#B11116] to-[#ef3b3b]", swatch: "#B11116", keywords: ["bpi"] },
  { id: "bdo", label: "BDO", gradient: "from-[#00153d] via-[#003DA5] to-[#2f7de1]", swatch: "#003DA5", keywords: ["bdo"] },
  { id: "gcash", label: "GCash", gradient: "from-[#001a7a] via-[#0052e0] to-[#3aa0ff]", swatch: "#007CFF", keywords: ["gcash", "g cash"] },
  { id: "gotyme", label: "GoTyme", gradient: "from-[#070b12] via-[#12243f] to-[#3a7ad4]", swatch: "#2B6CB0", keywords: ["gotyme", "go tyme", "tyme"] },
  { id: "landbank", label: "Landbank", gradient: "from-[#06351c] via-[#0b6b36] to-[#1db954]", swatch: "#0b6b36", keywords: ["landbank", "lbp"] },
  { id: "unionbank", label: "UnionBank", gradient: "from-[#9a3400] via-[#ef6a00] to-[#ffb25a]", swatch: "#ef6a00", keywords: ["unionbank", "ubp", "maribank"] },
  { id: "metrobank", label: "Metrobank", gradient: "from-[#1a2744] via-[#243868] to-[#f0c14b]", swatch: "#243868", keywords: ["metrobank"] },
  { id: "shopee", label: "Shopee", gradient: "from-[#9a2410] via-[#EE4D2D] to-[#ff8a62]", swatch: "#EE4D2D", keywords: ["shopee"] },
  { id: "maya", label: "Maya", gradient: "from-[#04352c] via-[#00A67E] to-[#5ee0b8]", swatch: "#00A67E", keywords: ["maya", "paymaya"] },
  { id: "others", label: "Others", gradient: "from-[#111827] via-[#334155] to-[#94a3b8]", swatch: "#475569", keywords: ["others", "other", "cash"] },
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
