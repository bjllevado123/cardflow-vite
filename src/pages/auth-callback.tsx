import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setAddingAccount } from "@/lib/account-vault";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      void navigate({ to: "/login" });
      return;
    }
    void supabase.auth.exchangeCodeForSession(window.location.href).finally(() => {
      setAddingAccount(false);
      void navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  return <p className="p-8 text-on-surface-variant">Signing you in…</p>;
}
