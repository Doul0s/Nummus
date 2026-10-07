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

export type HistoryPage = { rows: Expense[]; nextCursor: IsoDate | null };

export const EXPENSE_COLUMNS = `id, amount_minor AS amountMinor, currency_code AS currencyCode, label, note,
  spent_at AS spentAt, recurring_id AS recurringId, created_at AS createdAt`;

const FIELD_TO_COLUMN = {
  amountMinor: "amount_minor",
  currencyCode: "currency_code",
  label: "label",
  note: "note",
  spentAt: "spent_at",
} as const;

export async function getExpense(db: SQLiteDatabase, id: number): Promise<Expense | null> {
  return db.getFirstAsync<Expense>(`SELECT ${EXPENSE_COLUMNS} FROM expenses WHERE id = ?`, id);
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

export async function getHistoryPage(
  db: SQLiteDatabase,
  before: IsoDate | null,
  days: number
): Promise<HistoryPage> {
  const dates = await db.getAllAsync<{ spentAt: IsoDate }>(
    `SELECT DISTINCT spent_at AS spentAt FROM expenses ${before ? "WHERE spent_at < ?" : ""}
     ORDER BY spent_at DESC LIMIT ?`,
    ...(before ? [before, days] : [days])
  );
  if (dates.length === 0) return { rows: [], nextCursor: null };

  const oldest = dates[dates.length - 1].spentAt;
  const rows = await db.getAllAsync<Expense>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses WHERE spent_at BETWEEN ? AND ?
     ORDER BY spent_at DESC, id DESC`,
    oldest,
    dates[0].spentAt
  );
  return { rows, nextCursor: dates.length === days ? oldest : null };
}

export async function getExpensesSince(db: SQLiteDatabase, startIso: IsoDate): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    `SELECT ${EXPENSE_COLUMNS} FROM expenses WHERE spent_at >= ? ORDER BY spent_at DESC, id DESC`,
    startIso
  );
}
