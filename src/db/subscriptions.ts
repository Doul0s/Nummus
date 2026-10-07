import type { SQLiteDatabase } from "expo-sqlite";

import type { IsoDate } from "@/lib/date";
import { type Interval, dueDates } from "@/lib/recurring";

export type RecurringTemplate = {
  id: number;
  label: string;
  amountMinor: number;
  currencyCode: string;
  interval: Interval;
  startDate: IsoDate;
  lastGenerated: IsoDate | null;
  active: boolean;
};

export type NewRecurring = Omit<RecurringTemplate, "id" | "lastGenerated" | "active">;

type Row = Omit<RecurringTemplate, "active"> & { active: number };

const COLUMNS = `id, label, amount_minor AS amountMinor, currency_code AS currencyCode, interval,
  start_date AS startDate, last_generated AS lastGenerated, active`;

const toTemplate = (row: Row): RecurringTemplate => ({ ...row, active: row.active === 1 });

export async function listRecurring(db: SQLiteDatabase): Promise<RecurringTemplate[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT ${COLUMNS} FROM recurring_templates ORDER BY active DESC, label COLLATE NOCASE`
  );
  return rows.map(toTemplate);
}

export async function getRecurring(db: SQLiteDatabase, id: number): Promise<RecurringTemplate | null> {
  const row = await db.getFirstAsync<Row>(`SELECT ${COLUMNS} FROM recurring_templates WHERE id = ?`, id);
  return row ? toTemplate(row) : null;
}

export async function insertRecurring(db: SQLiteDatabase, input: NewRecurring): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO recurring_templates (label, amount_minor, currency_code, interval, start_date)
     VALUES (?, ?, ?, ?, ?)`,
    input.label,
    input.amountMinor,
    input.currencyCode,
    input.interval,
    input.startDate
  );
  return result.lastInsertRowId;
}

export async function setRecurringActive(
  db: SQLiteDatabase,
  id: number,
  active: boolean,
  today: IsoDate
): Promise<void> {
  if (!active) {
    await db.runAsync("UPDATE recurring_templates SET active = 0 WHERE id = ?", id);
    return;
  }
  const template = await getRecurring(db, id);
  const skipped = template ? dueDates(template, template.lastGenerated, today) : [];
  await db.runAsync(
    "UPDATE recurring_templates SET active = 1, last_generated = COALESCE(?, last_generated) WHERE id = ?",
    skipped[skipped.length - 1] ?? null,
    id
  );
}

export async function deleteRecurring(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE expenses SET recurring_id = NULL WHERE recurring_id = ?", id);
    await db.runAsync("DELETE FROM recurring_templates WHERE id = ?", id);
  });
}

async function generate(db: SQLiteDatabase, today: IsoDate): Promise<number> {
  const rows = await db.getAllAsync<Row>(`SELECT ${COLUMNS} FROM recurring_templates WHERE active = 1`);
  let created = 0;

  await db.withTransactionAsync(async () => {
    for (const template of rows.map(toTemplate)) {
      const dates = dueDates(template, template.lastGenerated, today);
      for (const date of dates) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO expenses (amount_minor, currency_code, label, spent_at, recurring_id)
           VALUES (?, ?, ?, ?, ?)`,
          template.amountMinor,
          template.currencyCode,
          template.label,
          date,
          template.id
        );
        created += result.changes;
      }
      if (dates.length > 0) {
        await db.runAsync("UPDATE recurring_templates SET last_generated = ? WHERE id = ?", dates[dates.length - 1], template.id);
      }
    }
  });

  return created;
}

let inFlight: Promise<number> | null = null;

export function generateDueExpenses(db: SQLiteDatabase, today: IsoDate): Promise<number> {
  inFlight ??= generate(db, today).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
