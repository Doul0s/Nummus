import type { SQLiteDatabase } from "expo-sqlite";

import { EXPENSE_COLUMNS, type Expense } from "@/db/expenses";
import { listRecurring } from "@/db/subscriptions";
import { type IsoDate, monthKeyOf, monthRange, weekRange } from "@/lib/date";
import { nextRenewal } from "@/lib/recurring";

export type CurrencyTotal = { currencyCode: string; totalMinor: number };

export type NextRenewal = {
  label: string;
  amountMinor: number;
  currencyCode: string;
  date: IsoDate;
};

export type SubscriptionTotals = { monthly: CurrencyTotal[]; yearly: CurrencyTotal[] };

export type Dashboard = {
  month: CurrencyTotal[];
  week: CurrencyTotal[];
  recurring: CurrencyTotal[];
  recent: Expense[];
  nextRenewal: NextRenewal | null;
};

function sumBetween(
  db: SQLiteDatabase,
  range: { startIso: IsoDate; endIso: IsoDate },
  onlyRecurring = false
): Promise<CurrencyTotal[]> {
  return db.getAllAsync<CurrencyTotal>(
    `SELECT currency_code AS currencyCode, SUM(amount_minor) AS totalMinor
     FROM expenses
     WHERE spent_at >= ? AND spent_at < ?${onlyRecurring ? " AND recurring_id IS NOT NULL" : ""}
     GROUP BY currency_code ORDER BY totalMinor DESC`,
    range.startIso,
    range.endIso
  );
}

export function getMonthlyTotal(db: SQLiteDatabase, today: IsoDate): Promise<CurrencyTotal[]> {
  return sumBetween(db, monthRange(monthKeyOf(today)));
}

export function getWeeklyTotal(
  db: SQLiteDatabase,
  today: IsoDate,
  firstWeekday: number
): Promise<CurrencyTotal[]> {
  return sumBetween(db, weekRange(today, firstWeekday));
}

export function getRecurringTotal(db: SQLiteDatabase, today: IsoDate): Promise<CurrencyTotal[]> {
  return sumBetween(db, monthRange(monthKeyOf(today)), true);
}

export function getRecentExpenses(db: SQLiteDatabase, limit: number): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses ORDER BY spent_at DESC, id DESC LIMIT ?`,
    limit
  );
}

export async function getSubscriptionTotals(db: SQLiteDatabase): Promise<SubscriptionTotals> {
  const [monthly, yearly] = await Promise.all([
    db.getAllAsync<CurrencyTotal>(
      `SELECT currency_code AS currencyCode,
              CAST(SUM(CASE interval WHEN 'monthly' THEN amount_minor ELSE ROUND(amount_minor / 12.0) END) AS INTEGER) AS totalMinor
       FROM recurring_templates WHERE active = 1
       GROUP BY currency_code ORDER BY totalMinor DESC`
    ),
    db.getAllAsync<CurrencyTotal>(
      `SELECT currency_code AS currencyCode,
              SUM(CASE interval WHEN 'monthly' THEN amount_minor * 12 ELSE amount_minor END) AS totalMinor
       FROM recurring_templates WHERE active = 1
       GROUP BY currency_code ORDER BY totalMinor DESC`
    ),
  ]);
  return { monthly, yearly };
}

export async function getNextRenewal(db: SQLiteDatabase, today: IsoDate): Promise<NextRenewal | null> {
  let best: NextRenewal | null = null;
  for (const template of await listRecurring(db)) {
    if (!template.active) continue;
    const date = nextRenewal(template, today);
    if (best === null || date < best.date) {
      best = {
        label: template.label,
        amountMinor: template.amountMinor,
        currencyCode: template.currencyCode,
        date,
      };
    }
  }
  return best;
}

export async function getDashboard(
  db: SQLiteDatabase,
  today: IsoDate,
  firstWeekday: number,
  recentLimit: number
): Promise<Dashboard> {
  const [month, week, recurring, recent, next] = await Promise.all([
    getMonthlyTotal(db, today),
    getWeeklyTotal(db, today, firstWeekday),
    getRecurringTotal(db, today),
    getRecentExpenses(db, recentLimit),
    getNextRenewal(db, today),
  ]);
  return { month, week, recurring, recent, nextRenewal: next };
}
