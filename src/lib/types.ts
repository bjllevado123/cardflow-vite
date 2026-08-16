export type TxnType = "charge" | "payment";
export type TxnFrequency = "one_time" | "recurring";
export type DefaultPeriodFilter = "all" | "closest_next";

export type Card = {
  id: string;
  name: string;
  institution: string;
  last_four: string | null;
  credit_limit: number | null;
  statement_day: number | null;
  color: string;
  sort_order: number;
  created_at: string;
};

export type BillingPeriod = {
  id: string;
  period_date: string;
  label: string;
  created_at: string;
};

export type RecurringRule = {
  id: string;
  card_id: string;
  type: TxnType;
  amount: number;
  notes: string | null;
  start_date: string;
  end_date: string | null;
  cadence: "semi_monthly" | "monthly";
  active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  card_id: string;
  billing_period_id: string;
  recurring_rule_id: string | null;
  txn_date: string | null;
  type: TxnType;
  frequency: TxnFrequency;
  amount: number;
  notes: string | null;
  created_at: string;
};

export type CardBalance = {
  card: Card;
  charges: number;
  payments: number;
  balance: number;
};

export type Snapshot = {
  email?: string;
  revision?: string;
  cards?: Card[];
  periods?: BillingPeriod[];
  transactions?: Transaction[];
  recurring_rules?: RecurringRule[];
};

export type SyncPayload = {
  version: 1;
  cards: Card[];
  periods: BillingPeriod[];
  transactions: Transaction[];
  recurring_rules: RecurringRule[];
  default_period_filter: DefaultPeriodFilter;
  excel_revision: string;
};
