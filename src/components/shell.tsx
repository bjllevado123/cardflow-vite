import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { BrandLogo } from "@/components/brand-logo";
import { PwaRegister } from "@/components/pwa-register";
import { TransactionForm } from "@/components/transaction-form";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Dashboard", short: "Home", icon: "dashboard" },
  { to: "/cards", label: "My Cards", short: "Cards", icon: "credit_card" },
  { to: "/transactions", label: "Transactions", short: "Activity", icon: "receipt_long" },
  { to: "/periods", label: "Periods", short: "Periods", icon: "calendar_month" },
  { to: "/settings", label: "Settings", short: "Settings", icon: "settings" },
] as const;

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const cards = useLiveQuery(() => db.cards.toArray()) ?? [];
  const periods = useLiveQuery(() => db.periods.orderBy("period_date").reverse().toArray()) ?? [];
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Signed in";

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[17rem_1fr]">
      <PwaRegister />
      <aside className="hidden h-screen flex-col border-r border-outline-variant/50 bg-surface-container-lowest/75 p-5 backdrop-blur-2xl md:sticky md:top-0 md:flex">
        <div className="mb-10 px-2 pt-2">
          <BrandLogo size="md" showTagline />
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1">
          {links.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm",
                  active
                    ? "bg-secondary-container/80 font-semibold text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-container-low",
                )}
              >
                {active ? <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-secondary" /> : null}
                <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 px-1 pb-1">
          <TransactionForm cards={cards} periods={periods} trigger="header" />
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-on-surface-variant">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant/40 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="md:hidden">
            <BrandLogo size="sm" />
          </div>
          <span className="ml-auto hidden size-9 place-items-center rounded-full bg-surface-container-high text-sm font-bold md:grid">
            {name.slice(0, 1).toUpperCase()}
          </span>
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 md:px-10 md:pb-10">
          <div className="mx-auto max-w-[1200px] space-y-8 animate-rise-delay-1 md:space-y-10">
            <Outlet />
          </div>
        </main>
        <nav className="fixed bottom-0 left-0 z-50 w-full pb-safe md:hidden">
          <div className="mx-3 mb-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/95 backdrop-blur-xl">
            <div className="flex h-[4.25rem] items-center justify-around">
              {links.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-0.5",
                      active ? "text-secondary" : "text-on-surface-variant opacity-70",
                    )}
                  >
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    <span className="text-[10px] font-semibold">{item.short}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
