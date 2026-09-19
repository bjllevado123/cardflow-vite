import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

function Chip({ compact }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-[0.35rem] bg-gradient-to-br from-[#f7e7b8] via-[#d4a84b] to-[#8a6a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.25)]",
        compact ? "h-7 w-9" : "h-9 w-11",
      )}
    >
      <div className="absolute inset-[3px] grid grid-cols-3 grid-rows-2 gap-px opacity-40">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="bg-[#5c4310]" />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25" />
    </div>
  );
}

function Contactless({ compact }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("text-white/85 drop-shadow-sm", compact ? "h-5 w-5" : "h-6 w-6")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M8 8c2.2 2.2 2.2 5.8 0 8" />
      <path d="M11.2 5.8c3.4 3.4 3.4 8.9 0 12.4" />
      <path d="M14.4 3.6c4.6 4.6 4.6 12.1 0 16.8" />
    </svg>
  );
}

export function CardVisual({
  name,
  holder,
  lastFour,
  balance,
  compact,
  color,
  className,
}: {
  name: string;
  holder?: string;
  lastFour?: string | null;
  balance?: number;
  compact?: boolean;
  color?: string | null;
  className?: string;
}) {
  const brand = resolveCardBrandFromCard(name, color);
  const mark = (brand.id === "others" ? name : brand.label).trim().slice(0, 1).toUpperCase() || "C";

  return (
    <div
      className={cn(
        "plastic-card relative isolate flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden text-white",
        compact ? "max-w-[300px] rounded-[1.25rem] p-4" : "max-w-[360px] rounded-[1.5rem] p-6",
        `bg-gradient-to-br ${brand.gradient}`,
        className,
      )}
    >
      <div className="plastic-card-sheen pointer-events-none absolute inset-0" />
      <div className="plastic-card-glass pointer-events-none absolute top-0 left-[-8%] h-1/2 w-[120%]" />
      <div className="plastic-card-texture pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/30" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-xl bg-white/18 font-bold tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/25",
              compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base",
            )}
          >
            {mark}
          </span>
          <span className={cn("truncate font-semibold tracking-[0.08em]", compact ? "text-sm" : "text-base")}>{name}</span>
        </div>
        <Contactless compact={compact} />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <Chip compact={compact} />
        <div className={cn("rounded-sm bg-black/25", compact ? "h-3.5 w-14" : "h-4 w-16")} aria-hidden />
      </div>

      <div className="relative z-10 min-w-0">
        {typeof balance === "number" ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Open balance</p>
            <p className={cn("mt-0.5 font-display font-semibold tabular-nums tracking-tight drop-shadow-sm", compact ? "text-xl" : "text-2xl")}>
              {formatPHP(balance)}
            </p>
          </>
        ) : (
          <p className={cn("font-display tracking-[0.2em]", compact ? "text-lg" : "text-xl")}>
            •••• {lastFour || "0000"}
          </p>
        )}
        <div className="mt-2 flex items-end justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
          <span className="truncate">{holder || "CardFlow"}</span>
          <span className="shrink-0">{lastFour ? `••${lastFour}` : "CardFlow"}</span>
        </div>
      </div>
    </div>
  );
}
