import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { signInWithGoogle, signInWithPassword, signUpWithPassword, supabaseEnabled } from "@/lib/supabase";

export function SignInForm({
  mode = "login",
  onAdded,
}: {
  mode?: "login" | "add";
  onAdded?: () => void;
}) {
  const { addAccountWithPassword, addAccountWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!supabaseEnabled) {
    return (
      <p className="text-sm text-on-surface-variant">
        Sign-in is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
      </p>
    );
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      if (mode === "add") onAdded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        className="w-full"
        size="lg"
        disabled={busy}
        onClick={() => void run(mode === "add" ? addAccountWithGoogle : signInWithGoogle)}
      >
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant">
        <span className="h-px flex-1 bg-outline-variant" />
        or email
        <span className="h-px flex-1 bg-outline-variant" />
      </div>
      <Input type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() =>
            void run(() =>
              mode === "add" ? addAccountWithPassword(email, password) : signInWithPassword(email, password),
            )
          }
        >
          {mode === "add" ? "Add account" : "Sign in"}
        </Button>
        {mode === "login" ? (
          <Button variant="ghost" className="flex-1" disabled={busy} onClick={() => void run(() => signUpWithPassword(email, password))}>
            Sign up
          </Button>
        ) : null}
      </div>
    </div>
  );
}
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-on-surface-variant">
        <span className="h-px flex-1 bg-outline-variant" />
        or email
        <span className="h-px flex-1 bg-outline-variant" />
      </div>
      <Input type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input
        type="password"
        autoComplete={mode === "add" ? "current-password" : "current-password"}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() =>
            void run(() =>
              mode === "add" ? addAccountWithPassword(email, password) : signInWithPassword(email, password),
            )
          }
        >
          {mode === "add" ? "Add account" : "Sign in"}
        </Button>
        {mode === "login" ? (
          <Button variant="ghost" className="flex-1" disabled={busy} onClick={() => void run(() => signUpWithPassword(email, password))}>
            Sign up
          </Button>
        ) : null}
      </div>
    </div>
  );
}
