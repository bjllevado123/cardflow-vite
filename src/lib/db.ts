import Dexie, { type EntityTable } from "dexie";
import type { BillingPeriod, Card, RecurringRule, Snapshot, Transaction } from "./types";
import { newId, todayIso } from "./utils";

class CardflowDB extends Dexie {
  cards!: EntityTable<Card, "id">;
  periods!: EntityTable<BillingPeriod, "id">;
  transactions!: EntityTable<Transaction, "id">;
  recurring!: EntityTable<RecurringRule, "id">;
  meta!: EntityTable<{ key: string; value: string }, "key">;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      cards: "id, name, sort_order",
      periods: "id, period_date",
      transactions: "id, card_id, billing_period_id, txn_date, type, created_at",
      recurring: "id, card_id, active",
      meta: "key",
    });
  }
}

type Active = { userId: string; db: CardflowDB };
let active: Active | null = null;

export function getDb() {
  if (!active) throw new Error("Database is not open");
  return active.db;
}

export const db = {
  get cards() {
    return getDb().cards;
  },
  get periods() {
    return getDb().periods;
  },
  get transactions() {
    return getDb().transactions;
  },
  get recurring() {
    return getDb().recurring;
  },
  get meta() {
    return getDb().meta;
  },
};

export async function openUserDatabase(userId: string) {
  if (active?.userId === userId) return active.db;
  active?.db.close();
  const instance = new CardflowDB(`cardflow_${userId}`);
  await instance.open();
  active = { userId, db: instance };
  return instance;
}

export function closeUserDatabase() {
  active?.db.close();
  active = null;
}

export async function replaceSnapshot(data: Snapshot) {
  const dbx = getDb();
  await dbx.transaction("rw", dbx.cards, dbx.periods, dbx.transactions, dbx.recurring, async () => {
    await dbx.cards.clear();
    await dbx.periods.clear();
    await dbx.transactions.clear();
    await dbx.recurring.clear();
    if (data.cards?.length) await dbx.cards.bulkPut(data.cards);
    if (data.periods?.length) await dbx.periods.bulkPut(data.periods);
    if (data.transactions?.length) await dbx.transactions.bulkPut(data.transactions);
    if (data.recurring_rules?.length) await dbx.recurring.bulkPut(data.recurring_rules);
  });
}

export async function addCard(input: Omit<Card, "id" | "created_at" | "sort_order">) {
  const count = await getDb().cards.count();
  const row: Card = {
    ...input,
    id: newId("card"),
    sort_order: count,
    created_at: new Date().toISOString(),
  };
  await getDb().cards.add(row);
  return row;
}

export async function addPeriod(period_date: string, label?: string) {
  const pretty =
    label?.trim() ||
    new Date(`${period_date}T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const row: BillingPeriod = {
    id: `per_${period_date}`,
    period_date,
    label: pretty,
    created_at: new Date().toISOString(),
  };
  await getDb().periods.put(row);
  return row;
}

export async function addTransaction(input: {
  card_id: string;
  billing_period_id: string;
  type: Transaction["type"];
  amount: number;
  notes?: string;
  frequency?: Transaction["frequency"];
  txn_date?: string;
}) {
  const row: Transaction = {
    id: newId("txn"),
    card_id: input.card_id,
    billing_period_id: input.billing_period_id,
    recurring_rule_id: null,
    txn_date: input.txn_date ?? todayIso(),
    type: input.type,
    frequency: input.frequency ?? "one_time",
    amount: input.amount,
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };
  await getDb().transactions.add(row);
  return row;
}

export async function deleteTransaction(id: string) {
  await getDb().transactions.delete(id);
}

export async function getDefaultPeriodFilter(): Promise<"all" | "closest_next"> {
  const row = await getDb().meta.get("default_period_filter");
  return row?.value === "all" ? "all" : "closest_next";
}

export async function setDefaultPeriodFilter(value: "all" | "closest_next") {
  await getDb().meta.put({ key: "default_period_filter", value });
}
