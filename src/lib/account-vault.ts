import type { Session, User } from "@supabase/supabase-js";

export type SavedAccount = {
  userId: string;
  email: string;
  name: string;
  access_token: string;
  refresh_token: string;
};

const VAULT_KEY = "cardflow.accounts.v1";
const ADDING_KEY = "cardflow.addingAccount";
export const MAX_SAVED_ACCOUNTS = 6;

function readVault(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is SavedAccount =>
        Boolean(
          row &&
            typeof row === "object" &&
            typeof row.userId === "string" &&
            typeof row.refresh_token === "string" &&
            typeof row.access_token === "string",
        ),
    );
  } catch {
    return [];
  }
}

function writeVault(accounts: SavedAccount[]) {
  localStorage.setItem(VAULT_KEY, JSON.stringify(accounts));
}

export function displayNameFromUser(user: User) {
  return (
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Signed in"
  );
}

export function accountFromSession(session: Session): SavedAccount | null {
  if (!session.user?.id || !session.access_token || !session.refresh_token) return null;
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: displayNameFromUser(session.user),
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
}

export function listAccounts(): SavedAccount[] {
  return readVault();
}

export function getAccount(userId: string) {
  return readVault().find((row) => row.userId === userId);
}

export function upsertAccount(account: SavedAccount) {
  const rest = readVault().filter((row) => row.userId !== account.userId);
  writeVault([account, ...rest]);
}

export function removeAccount(userId: string) {
  writeVault(readVault().filter((row) => row.userId !== userId));
}

export function clearVault() {
  localStorage.removeItem(VAULT_KEY);
}

export function setAddingAccount(value: boolean) {
  if (value) localStorage.setItem(ADDING_KEY, "1");
  else localStorage.removeItem(ADDING_KEY);
}

export function isAddingAccount() {
  return localStorage.getItem(ADDING_KEY) === "1";
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone);
  return standalone || ios;
}
