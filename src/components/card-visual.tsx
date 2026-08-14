import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";

export function CardVisual({
  name,
  holder,
  lastFour,
  balance,
  compact,
  color,
}: {
  name: string;
  holder?: string;
  lastFour?: string | null;
  balance?: number;
  compact?: boolean;
  color?: string | null;
}) {
  const brand = resolveCardBrandFromCard(name, color);
  return (
    <div
      className={`w-full ${compact ? "max-w-[280px]" : "max-w-[340px]"} aspect-[1.586/1] bg-gradient-to-br ${brand.gradient} rounded-[1.5rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between`}
    >
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 -skew-y-6 origin-top-left" />
      <div className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="flex justify-between items-start z-10">
        <span className="font-bold tracking-widest text-sm md:text-base">{name}</span>
        <span className="material-symbols-outlined text-white/70">contactless</span>
      </div>
      <div className="z-10 space-y-3">
        {typeof balance === "number" ? (
          <div className="text-xl font-semibold tabular-nums">{formatPHP(balance)}</div>
        ) : (
          <div className="text-xl tracking-[0.2em] opacity-90">•••• •••• •••• {lastFour || "0000"}</div>
        )}
        <div className="flex justify-between text-[12px] font-bold tracking-[0.08em] uppercase opacity-70">
          <span>{holder || "CardFlow"}</span>
          {lastFour ? <span>•••• {lastFour}</span> : <span>Balance</span>}
        </div>
      </div>
    </div>
  );
}
