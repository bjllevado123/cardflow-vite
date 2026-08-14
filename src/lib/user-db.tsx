import { useEffect, useState } from "react";
import { closeUserDatabase, openUserDatabase } from "@/lib/db";
import { importExcelIfEmpty } from "@/lib/excel-hydrate";

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
    setReady(false);
    void (async () => {
      await openUserDatabase(userId);
      await importExcelIfEmpty(email);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
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
