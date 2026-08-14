import { Link } from "@tanstack/react-router";

const sizes = {
  sm: { mark: "h-8 w-8", word: "text-xl", gap: "gap-2.5", tag: "text-[10px]" },
  md: { mark: "h-10 w-10", word: "text-[1.65rem]", gap: "gap-3", tag: "text-xs" },
  lg: { mark: "h-12 w-12", word: "text-3xl", gap: "gap-3.5", tag: "text-sm" },
} as const;

function Mark({ className }: { className: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center rounded-2xl shrink-0 ${className}`} aria-hidden>
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0b1f17] via-[#123528] to-[#0a1628] shadow-[0_10px_24px_rgba(10,40,28,0.28)]" />
      <span className="absolute inset-[3px] rounded-[0.85rem] border border-white/10" />
      <span className="relative w-[58%] h-[42%]">
        <span className="absolute inset-0 translate-x-[14%] -translate-y-[18%] rounded-md bg-white/15 rotate-[8deg]" />
        <span className="absolute inset-0 -translate-x-[6%] translate-y-[6%] rounded-md bg-gradient-to-br from-[#9af5c8] to-[#3dd68c] shadow-[0_2px_8px_rgba(61,214,140,0.45)]" />
        <span className="absolute left-1 top-1 h-1 w-3 rounded-full bg-white/70" />
      </span>
    </span>
  );
}

export function BrandLogo({
  href = "/",
  size = "md",
  showTagline = false,
  className = "",
}: {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}) {
  const s = sizes[size];
  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <Mark className={s.mark} />
      <span className="min-w-0 leading-none">
        <span className={`block font-display font-semibold tracking-[-0.03em] text-on-background ${s.word}`}>
          Card<span className="text-secondary">Flow</span>
        </span>
        {showTagline ? (
          <span className={`block mt-1.5 font-sans font-medium tracking-[0.14em] uppercase text-on-surface-variant ${s.tag}`}>
            Clean Finance
          </span>
        ) : null}
      </span>
    </span>
  );
  if (href == null) return content;
  return (
    <Link to={href} className="group inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-secondary/40">
      {content}
    </Link>
  );
}
