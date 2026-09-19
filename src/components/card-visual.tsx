import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

function Chip({ compact }: { compact?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-gradient-to-br from-[#f4e2b0] via-[#d4a84b] to-[#8a6a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
        compact ? "h-6 w-8" : "h-8 w-10",
      )}
    >
      <div className="absolute inset-[3px] grid grid-cols-3 grid-rows-2 gap-px opacity-35">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="bg-[#5c4310]" />
        ))}
      </div>
    </div>
  );
}

function Contactless({ compact }: { compact?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("text-white/80", compact ? "h-5 w-5" : "h-6 w-6")}
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
        "relative isolate flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden text-white",
        compact ? "max-w-[300px] rounded-[1.15rem] p-3.5" : "max-w-[360px] rounded-[1.4rem] p-5",
        `bg-gradient-to-br ${brand.gradient}`,
        "shadow-[0_20px_36px_-16px_rgba(15,23,42,0.55)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(255,255,255,0.26),transparent_46%),radial-gradient(90%_70%_at_100%_120%,rgba(0,0,0,0.28),transparent_48%)]" />
      <div className="pointer-events-none absolute -right-10 top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-xl bg-white/14 font-bold tracking-tight ring-1 ring-white/25 backdrop-blur-sm",
              compact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base",
            )}
          >
            {mark}
          </span>
          <span className={cn("truncate font-semibold tracking-wide", compact ? "text-sm" : "text-base")}>{name}</span>
        </div>
        <Contactless compact={compact} />
      </div>

      <div className="relative z-10">
        <Chip compact={compact} />
      </div>

      <div className="relative z-10 min-w-0">
        {typeof balance === "number" ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">Open balance</p>
            <p className={cn("mt-0.5 font-display font-semibold tabular-nums tracking-tight", compact ? "text-xl" : "text-2xl")}>
              {formatPHP(balance)}
            </p>
          </>
        ) : (
          <p className={cn("font-display tracking-[0.2em]", compact ? "text-lg" : "text-xl")}>
            •••• {lastFour || "0000"}
          </p>
        )}
        <div className="mt-2 flex items-end justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
          <span className="truncate">{holder || "CardFlow"}</span>
          <span className="shrink-0">{lastFour ? `••${lastFour}` : "CardFlow"}</span>
        </div>
      </div>
    </div>
  );
}
