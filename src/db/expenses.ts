import type { SQLiteDatabase } from "expo-sqlite";

import type { IsoDate } from "@/lib/date";

export type Expense = {
  id: number;
  amountMinor: number;
  currencyCode: string;
  label: string;
  note: string | null;
  spentAt: IsoDate;
  createdAt: string;
};

export type NewExpense = {
  amountMinor: number;
  currencyCode: string;
  label: string;
  note?: string | null;
  spentAt: IsoDate;
};

export type ExpensePatch = Partial<Omit<Expense, "id" | "createdAt">>;

export type DateRange = { startIso: IsoDate; endIso: IsoDate };

export type CurrencyTotal = { currencyCode: string; totalMinor: number };

const COLUMNS = `id, amount_minor AS amountMinor, currency_code AS currencyCode, label, note,
  spent_at AS spentAt, created_at AS createdAt`;

const FIELD_TO_COLUMN = {
  amountMinor: "amount_minor",
  currencyCode: "currency_code",
  label: "label",
  note: "note",
  spentAt: "spent_at",
} as const;

function rangeClause(range?: DateRange) {
  return range
    ? { where: "WHERE spent_at >= ? AND spent_at < ?", params: [range.startIso, range.endIso] }
    : { where: "", params: [] as string[] };
}

export async function listExpenses(db: SQLiteDatabase, range?: DateRange): Promise<Expense[]> {
  const { where, params } = rangeClause(range);
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
  range?: DateRange
): Promise<CurrencyTotal[]> {
  const { where, params } = rangeClause(range);
  return db.getAllAsync<CurrencyTotal>(
    `SELECT currency_code AS currencyCode, SUM(amount_minor) AS totalMinor
     FROM expenses ${where} GROUP BY currency_code ORDER BY totalMinor DESC`,
    params
  );
}