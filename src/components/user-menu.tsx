import { useState } from "react";
import { toast } from "sonner";
import { SignInForm } from "@/components/sign-in-form";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MENU_ID = "user-account-menu";

function closeMenu() {
  const menu = document.getElementById(MENU_ID);
  if (menu && "hidePopover" in menu) {
    (menu as HTMLElement).hidePopover();
  }
}

function initialFor(name: string) {
  return name.slice(0, 1).toUpperCase();
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
  const initial = initialFor(name);

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
  const { user, accounts, switchAccount, signOutThisAccount, signOutAll } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const others = accounts.filter((row) => row.userId !== user?.id);

  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
      <div id={MENU_ID} popover="auto" className="user-menu">
        <div className="border-b border-outline-variant/50 px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          {email ? <p className="truncate text-xs text-on-surface-variant">{email}</p> : null}
        </div>
        {others.length > 0 ? (
          <div className="max-h-48 overflow-y-auto py-1">
            {others.map((row) => (
              <button
                key={row.userId}
                type="button"
                className="user-menu-item flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left"
                onClick={() => {
                  closeMenu();
                  void run(() => switchAccount(row.userId));
                }}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-container-high text-xs font-bold">
                  {initialFor(row.name || row.email)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{row.name || row.email}</span>
                  {row.email ? <span className="block truncate text-xs text-on-surface-variant">{row.email}</span> : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className="user-menu-item flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold"
          onClick={() => {
            closeMenu();
            setAddOpen(true);
          }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            person_add
          </span>
          Add account
        </button>
        <button
          type="button"
          className={cn("user-menu-item-danger mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-error")}
          onClick={() => {
            closeMenu();
            void run(signOutThisAccount);
          }}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            logout
          </span>
          Sign out
        </button>
        {accounts.length > 1 ? (
          <button
            type="button"
            className="user-menu-item-danger flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-error"
            onClick={() => {
              closeMenu();
              void run(signOutAll);
            }}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              logout
            </span>
            Sign out of all accounts
          </button>
        ) : null}
      </div>
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add account"
        description="Sign in with that CardFlow login. Each account keeps its own cards and payments."
      >
        <SignInForm mode="add" onAdded={() => setAddOpen(false)} />
      </Modal>
    </>
  );
}
