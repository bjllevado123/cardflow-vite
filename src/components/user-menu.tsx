import type { MouseEvent } from "react";
import { signOut } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const MENU_ID = "user-account-menu";

function closeMenuThenSignOut(event: MouseEvent<HTMLButtonElement>) {
  const menu = event.currentTarget.closest("[popover]");
  if (menu && "hidePopover" in menu) {
    (menu as HTMLElement).hidePopover();
  }
  void signOut();
}

export function UserMenuTrigger({
  name,
  email,
  variant,
}: {
  name: string;
  email?: string | null;
  variant: "sidebar" | "header";
}) {
  const initial = name.slice(0, 1).toUpperCase();

  if (variant === "header") {
    return (
      <button
        type="button"
        className="user-menu-trigger grid size-9 place-items-center rounded-full bg-surface-container-high text-sm font-bold"
        popoverTarget={MENU_ID}
        aria-label={`Account menu for ${name}`}
      >
        {initial}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="user-menu-trigger flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left"
      popoverTarget={MENU_ID}
      aria-label={`Account menu for ${name}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-on-primary">
        {initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{name}</span>
        {email ? <span className="block truncate text-xs text-on-surface-variant">{email}</span> : null}
      </span>
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden>
        expand_more
      </span>
    </button>
  );
}

export function UserMenuPopover({ name, email }: { name: string; email?: string | null }) {
  return (
    <div id={MENU_ID} popover="auto" className="user-menu">
      <div className="border-b border-outline-variant/50 px-3 py-2.5">
        <p className="truncate text-sm font-semibold">{name}</p>
        {email ? <p className="truncate text-xs text-on-surface-variant">{email}</p> : null}
      </div>
      <button
        type="button"
        className={cn(
          "user-menu-item mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-error",
        )}
        onClick={closeMenuThenSignOut}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          logout
        </span>
        Sign out
      </button>
    </div>
  );
}
