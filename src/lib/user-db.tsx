import { useEffect, useState } from "react";
import { applyPendingDataFixes, closeUserDatabase, openUserDatabase } from "@/lib/db";
import { listenForCloudSync, startCloudSync, stopCloudSync } from "@/lib/sync";

export function UserDatabaseProvider({
  userId,
  email,
  children,
}: {
  userId: string;
  email?: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;
    setReady(false);
    void (async () => {
      await openUserDatabase(userId);
      await startCloudSync(userId, email);
      await applyPendingDataFixes();
      if (cancelled) return;
      teardown = listenForCloudSync(userId);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      teardown?.();
      stopCloudSync();
      closeUserDatabase();
    };
  }, [userId, email]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <p className="text-sm font-medium text-on-surface-variant">Loading your data…</p>
      </div>
    );
  }

  return children;
}
