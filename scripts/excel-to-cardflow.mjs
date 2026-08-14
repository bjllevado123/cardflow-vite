import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const downloads = resolve(process.env.USERPROFILE || "", "Downloads");

const JOBS = [
  {
    file: resolve(downloads, "CC Tracker - Brian Llevado 2026.xlsx"),
    out: resolve(root, "src/data/brian.json"),
    email: "llevadob@gmail.com",
  },
  {
    file: resolve(downloads, "CC Tracker - Tatay & Nanay 2026.xlsx"),
    out: resolve(root, "src/data/parents.json"),
    email: "parents@cardflow.app",
  },
];

const WALLET_RE = /gcash|gotyme|go tyme|maya|paymaya|shopee|cash/i;
const BRANDS = [
  { re: /bpi/i, color: "bpi", statement_day: 15 },
  { re: /bdo/i, color: "bdo", statement_day: 30 },
  { re: /gcash/i, color: "gcash" },
  { re: /maya|paymaya/i, color: "maya" },
  { re: /gotyme|tyme/i, color: "gotyme" },
  { re: /shopee/i, color: "shopee" },
];

function brandFor(name) {
  return BRANDS.find((b) => b.re.test(name)) ?? { color: "others", statement_day: 15 };
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "card";
}

function parseSheetDate(label) {
  const m = String(label).match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
  );
  if (!m) return null;
  const months = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  };
  return `${m[3] || "2026"}-${months[m[1].toLowerCase()]}-${m[2].padStart(2, "0")}`;
}

function excelDateToIso(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(v));
    return epoch.toISOString().slice(0, 10);
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function mapType(t) {
  const s = String(t ?? "").trim().toLowerCase();
  if (s === "charge") return "charge";
  if (s === "payment") return "payment";
  return null;
}

function periodLabel(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function parseWorkbook(filePath) {
  const wb = XLSX.read(readFileSync(filePath), { type: "buffer", cellDates: true });
  const cards = new Map();
  const periods = new Map();
  const transactions = [];
  const subKeys = new Map();
  const now = new Date().toISOString();

  for (const sheetName of wb.SheetNames) {
    if (sheetName === "Template" || sheetName === "Overall") continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
    const periodDate =
      parseSheetDate(sheetName) || excelDateToIso(rows[0]?.[0]) || parseSheetDate(String(rows[0]?.[0] ?? ""));
    if (!periodDate) continue;

    const periodId = `per_${periodDate}`;
    if (!periods.has(periodId)) {
      periods.set(periodId, {
        id: periodId,
        period_date: periodDate,
        label: periodLabel(periodDate),
        created_at: now,
      });
    }

    let start = 0;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      if (String(rows[i]?.[0] ?? "").toLowerCase() === "date") {
        start = i + 1;
        break;
      }
    }

    for (let i = start; i < rows.length; i++) {
      const row = rows[i];
      const type = mapType(row?.[1]);
      if (!type) continue;
      const amount = Number(row?.[3]);
      if (!amount || Number.isNaN(amount)) continue;
      const accountName = String(row?.[4] ?? "Others").trim() || "Others";
      const notes = row?.[5] != null ? String(row[5]).trim() : null;
      const recurring = String(row?.[2] ?? "").toLowerCase().includes("recurring");
      const txn_date = excelDateToIso(row?.[0]) || periodDate;

      if (!cards.has(accountName)) {
        const brand = brandFor(accountName);
        const wallet = WALLET_RE.test(accountName);
        cards.set(accountName, {
          id: `card_${slug(accountName)}`,
          name: accountName,
          institution: accountName,
          last_four: null,
          credit_limit: null,
          statement_day: wallet ? null : (brand.statement_day ?? 15),
          color: brand.color,
          sort_order: cards.size,
          created_at: now,
        });
      }

      const card = cards.get(accountName);
      transactions.push({
        id: `txn_${randomUUID()}`,
        card_id: card.id,
        billing_period_id: periodId,
        recurring_rule_id: null,
        txn_date,
        type,
        frequency: recurring ? "recurring" : "one_time",
        amount,
        notes,
        created_at: now,
      });

      if (recurring && type === "charge") {
        const key = `${card.id}|${amount}|${notes ?? ""}`;
        if (!subKeys.has(key)) {
          subKeys.set(key, {
            id: `sub_${randomUUID()}`,
            card_id: card.id,
            type: "charge",
            amount,
            notes,
            start_date: txn_date,
            end_date: null,
            cadence: "semi_monthly",
            active: true,
            created_at: now,
          });
        }
      }
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: [...cards.values()],
    periods: [...periods.values()].sort((a, b) => b.period_date.localeCompare(a.period_date)),
    transactions,
    recurring_rules: [...subKeys.values()],
  };
}

mkdirSync(resolve(root, "src/data"), { recursive: true });

for (const job of JOBS) {
  const buf = readFileSync(job.file);
  const payload = parseWorkbook(job.file);
  payload.email = job.email;
  payload.revision = createHash("sha256").update(buf).digest("hex").slice(0, 16);
  writeFileSync(job.out, JSON.stringify(payload));
  console.log(
    JSON.stringify({
      email: job.email,
      revision: payload.revision,
      cards: payload.cards.length,
      periods: payload.periods.length,
      transactions: payload.transactions.length,
      recurring: payload.recurring_rules.length,
    }),
  );
}
