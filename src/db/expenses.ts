import type { SQLiteDatabase } from "expo-sqlite";

import type { IsoDate } from "@/lib/date";

export type Expense = {
  id: number;
  amountMinor: number;
  currencyCode: string;
  label: string;
  note: string | null;
  spentAt: IsoDate;
  recurringId: number | null;
  createdAt: string;
};

export type NewExpense = {
  amountMinor: number;
  currencyCode: string;
  label: string;
  note?: string | null;
  spentAt: IsoDate;
};

export type ExpensePatch = Partial<Omit<Expense, "id" | "createdAt" | "recurringId">>;

export type DateRange = { startIso: IsoDate; endIso: IsoDate };

export type CurrencyTotal = { currencyCode: string; totalMinor: number };

const COLUMNS = `id, amount_minor AS amountMinor, currency_code AS currencyCode, label, note,
  spent_at AS spentAt, recurring_id AS recurringId, created_at AS createdAt`;

const FIELD_TO_COLUMN = {
  amountMinor: "amount_minor",
  currencyCode: "currency_code",
  label: "label",
  note: "note",
  spentAt: "spent_at",
} as const;

function whereClause(range?: DateRange, onlyRecurring = false) {
  const conditions: string[] = [];
  const params: string[] = [];
  if (range) {
    conditions.push("spent_at >= ? AND spent_at < ?");
    params.push(range.startIso, range.endIso);
  }
  if (onlyRecurring) conditions.push("recurring_id IS NOT NULL");
  return { where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

export async function listExpenses(db: SQLiteDatabase, range?: DateRange): Promise<Expense[]> {
  const { where, params } = whereClause(range);
  return db.getAllAsync<Expense>(
    `SELECT ${COLUMNS} FROM expenses ${where} ORDER BY spent_at DESC, id DESC`,
    params
  );
}

export async function getExpense(db: SQLiteDatabase, id: number): Promise<Expense | null> {
  return db.getFirstAsync<Expense>(`SELECT ${COLUMNS} FROM expenses WHERE id = ?`, id);
}

export async function insertExpense(db: SQLiteDatabase, input: NewExpense): Promise<number> {
  const result = await db.runAsync(
    "INSERT INTO expenses (amount_minor, currency_code, label, note, spent_at) VALUES (?, ?, ?, ?, ?)",
    input.amountMinor,
    input.currencyCode,
    input.label,
    input.note ?? null,
    input.spentAt
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  patch: ExpensePatch
): Promise<void> {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined) as [
    keyof typeof FIELD_TO_COLUMN,
    string | number | null,
  ][];
  if (entries.length === 0) return;

  const sets = entries.map(([key]) => `${FIELD_TO_COLUMN[key]} = ?`).join(", ");
  await db.runAsync(`UPDATE expenses SET ${sets} WHERE id = ?`, [
    ...entries.map(([, value]) => value),
    id,
  ]);
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM expenses WHERE id = ?", id);
}

export async function sumExpensesByCurrency(
  db: SQLiteDatabase,
  range?: DateRange,
  onlyRecurring = false
): Promise<CurrencyTotal[]> {
  const { where, params } = whereClause(range, onlyRecurring);
  return db.getAllAsync<CurrencyTotal>(
    `SELECT currency_code AS currencyCode, SUM(amount_minor) AS totalMinor
     FROM expenses ${where} GROUP BY currency_code ORDER BY totalMinor DESC`,
    params
  );
}

export async function listRecentExpenses(db: SQLiteDatabase, limit: number): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    `SELECT ${COLUMNS} FROM expenses ORDER BY spent_at DESC, id DESC LIMIT ?`,
    limit
  );
}

export async function lastUsedCurrency(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ currencyCode: string }>(
    "SELECT currency_code AS currencyCode FROM expenses ORDER BY id DESC LIMIT 1"
  );
  return row?.currencyCode ?? null;
}
