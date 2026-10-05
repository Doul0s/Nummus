import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "nummus.db";

type Migration = {
  version: number;
  statements: string[];
};

export const migrations: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
        currency_code TEXT NOT NULL,
        label TEXT NOT NULL,
        note TEXT,
        spent_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      );`,
      `CREATE INDEX IF NOT EXISTS expenses_spent_at_idx ON expenses (spent_at DESC);`,
    ],
  },
  {
    version: 3,
    statements: [
      `CREATE TABLE recurring_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
        currency_code TEXT NOT NULL,
        interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly')),
        start_date TEXT NOT NULL,
        last_generated TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      );`,
      `ALTER TABLE expenses ADD COLUMN recurring_id INTEGER;`,
      `CREATE UNIQUE INDEX expenses_recurring_date_idx ON expenses (recurring_id, spent_at) WHERE recurring_id IS NOT NULL;`,
    ],
  },
];

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const current = row?.user_version ?? 0;
  if (current === 0) await db.execAsync("PRAGMA journal_mode = WAL;");

  for (const { version, statements } of migrations) {
    if (version <= current) continue;
    await db.withTransactionAsync(async () => {
      for (const sql of statements) await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
