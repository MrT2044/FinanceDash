export type TransactionRecord = {
  id: string;
  booking_date: string;
  amount: number;
  purpose: string | null;
  counterparty_name: string | null;
  category_id: string | null;
  category_source: string;
  account_id: string;
};

export type CategoryMeta = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
};

export type MonthlySummary = {
  monthKey: string;
  income: number;
  expenses: number;
  net: number;
};

export type CategorySummary = {
  categoryId: string | null;
  name: string;
  color: string;
  slug: string;
  total: number;
  share: number;
  transactionCount: number;
  /** Veränderung gegenüber dem Durchschnitt der Vormonate, null wenn keine Historie. */
  changeRatio: number | null;
  averagePrevious: number;
};

export type DashboardKpis = {
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  available: number;
  savingsRate: number | null;
};
