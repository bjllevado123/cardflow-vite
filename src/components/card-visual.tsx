import { formatPHP } from "@/lib/money";
import { resolveCardBrandFromCard } from "@/lib/card-brands";
import { cn } from "@/lib/utils";

function Chip() {
  return (
    <div
      aria-hidden
      className="relative h-[1.35rem] w-[1.7rem] overflow-hidden rounded-[0.3rem] bg-gradient-to-br from-[#f7e7b8] via-[#d4a84b] to-[#8a6a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(0,0,0,0.25)] @[18rem]:h-7 @[18rem]:w-9 @[24rem]:h-9 @[24rem]:w-11"
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

function Contactless() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="hidden h-5 w-5 text-white/85 drop-shadow-sm @[18rem]:block @[24rem]:h-6 @[24rem]:w-6"
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
    <div className={cn("@container w-full min-w-0", compact ? "max-w-[300px]" : "max-w-[360px]", className)}>
      <div
        className={cn(
          "plastic-card relative isolate flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden text-white",
          "rounded-[1.15rem] p-3 @[18rem]:rounded-[1.35rem] @[18rem]:p-4 @[24rem]:rounded-[1.5rem] @[24rem]:p-6",
          `bg-gradient-to-br ${brand.gradient}`,
        )}
      >
        <div className="plastic-card-sheen pointer-events-none absolute inset-0" />
        <div className="plastic-card-glass pointer-events-none absolute top-0 left-[-8%] h-1/2 w-[120%]" />
        <div className="plastic-card-texture pointer-events-none absolute inset-0 opacity-80" />
        <div className="pointer-events-none absolute -right-8 -bottom-10 h-36 w-36 rounded-full bg-white/28" />
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/45" />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 @[18rem]:gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/18 text-xs font-bold tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/25 @[18rem]:h-8 @[18rem]:w-8 @[18rem]:rounded-xl @[18rem]:text-sm @[24rem]:h-10 @[24rem]:w-10 @[24rem]:text-base">
              {mark}
            </span>
            <span className="truncate text-sm font-semibold tracking-[0.08em] @[24rem]:text-base">{name}</span>
          </div>
          <Contactless />
        </div>

        <div className="relative z-10 flex items-center gap-2 @[18rem]:gap-3">
          <Chip />
          <div className="hidden h-3.5 w-12 rounded-sm bg-black/25 @[20rem]:block @[24rem]:h-4 @[24rem]:w-16" aria-hidden />
        </div>

        <div className="relative z-10 min-w-0">
          {typeof balance === "number" ? (
            <>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75 @[18rem]:text-[10px] @[18rem]:tracking-[0.18em]">
                Open balance
              </p>
              <p className="mt-0.5 font-display font-semibold tabular-nums tracking-tight text-[clamp(1.05rem,7.4cqi,1.65rem)] drop-shadow-sm">
                {formatPHP(balance)}
              </p>
            </>
          ) : (
            <p className="font-display tracking-[0.16em] text-[clamp(1rem,6.5cqi,1.35rem)]">•••• {lastFour || "0000"}</p>
          )}
          <div className="mt-1.5 hidden items-end justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75 @[20rem]:flex">
            <span className="truncate">{holder || "CardFlow"}</span>
            <span className="shrink-0">{lastFour ? `••${lastFour}` : "CardFlow"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
