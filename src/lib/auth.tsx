import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  MAX_SAVED_ACCOUNTS,
  type SavedAccount,
  accountFromSession,
  clearVault,
  getAccount,
  listAccounts,
  removeAccount,
  setAddingAccount,
  upsertAccount,
} from "@/lib/account-vault";
import { signInWithGoogle, signInWithPassword, signOut as signOutClient, supabase } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accounts: SavedAccount[];
  switchAccount: (userId: string) => Promise<void>;
  addAccountWithPassword: (email: string, password: string) => Promise<void>;
  addAccountWithGoogle: () => Promise<void>;
  signOutThisAccount: () => Promise<void>;
  signOutAll: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function persistSession(session: Session | null) {
  if (!session) return;
  const row = accountFromSession(session);
  if (row) upsertAccount(row);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => (typeof window === "undefined" ? [] : listAccounts()));

  function refreshAccounts() {
    setAccounts(listAccounts());
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void persistSession(data.session).then(refreshAccounts);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void persistSession(next).then(refreshAccounts);
      }
      if (event === "SIGNED_OUT") refreshAccounts();
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      accounts,
      async switchAccount(userId: string) {
        if (!supabase) throw new Error("Supabase is not configured");
        if (session?.user.id === userId) return;
        const target = getAccount(userId);
        if (!target) throw new Error("That account is not saved on this device");
        const { data: current } = await supabase.auth.getSession();
        await persistSession(current.session);
        const { error } = await supabase.auth.setSession({
          access_token: target.access_token,
          refresh_token: target.refresh_token,
        });
        if (error) {
          removeAccount(userId);
          refreshAccounts();
          throw error;
        }
        refreshAccounts();
      },
      async addAccountWithPassword(email: string, password: string) {
        if (!supabase) throw new Error("Supabase is not configured");
        const { data: current } = await supabase.auth.getSession();
        await persistSession(current.session);
        const existing = listAccounts();
        const already = existing.some((row) => row.email.toLowerCase() === email.trim().toLowerCase());
        if (!already && existing.length >= MAX_SAVED_ACCOUNTS) {
          throw new Error(`This device can remember ${MAX_SAVED_ACCOUNTS} accounts`);
        }
        await signInWithPassword(email, password);
        refreshAccounts();
      },
      async addAccountWithGoogle() {
        if (!supabase) throw new Error("Supabase is not configured");
        const { data: current } = await supabase.auth.getSession();
        await persistSession(current.session);
        if (listAccounts().length >= MAX_SAVED_ACCOUNTS) {
          throw new Error(`This device can remember ${MAX_SAVED_ACCOUNTS} accounts`);
        }
        setAddingAccount(true);
        await signInWithGoogle();
      },
      async signOutThisAccount() {
        if (!supabase) return;
        const currentId = session?.user.id;
        const next = listAccounts().find((row) => row.userId !== currentId);
        if (currentId) removeAccount(currentId);
        refreshAccounts();
        if (next) {
          const { error } = await supabase.auth.setSession({
            access_token: next.access_token,
            refresh_token: next.refresh_token,
          });
          if (error) {
            removeAccount(next.userId);
            refreshAccounts();
            await signOutClient("local");
          }
          return;
        }
        await signOutClient("local");
      },
      async signOutAll() {
        clearVault();
        refreshAccounts();
        await signOutClient("local");
      },
    }),
    [session, loading, accounts],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
