import { getDb, replaceSnapshot } from "@/lib/db";
import type { Snapshot } from "@/lib/types";

const files = import.meta.glob("../data/*.json", { eager: true, import: "default" }) as Record<
  string,
  Snapshot
>;

export async function importExcelIfEmpty(email: string | undefined) {
  if (!email) return;
  const snap = Object.values(files).find((s) => s.email?.toLowerCase() === email.toLowerCase());
  if (!snap) return;
  const revision = snap.revision ?? "";
  if (!revision) return;
  const current = await getDb().meta.get("excel_revision");
  if (current?.value) return;
  await replaceSnapshot(snap);
  await getDb().meta.put({ key: "excel_revision", value: revision });
  await getDb().meta.put({ key: "default_period_filter", value: "closest_next" });
}
