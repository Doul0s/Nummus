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
    version: 2,
    statements: [
      `DROP TABLE IF EXISTS expenses;`,
      `CREATE TABLE expenses (
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
];

export const SCHEMA_VERSION = migrations.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0
);

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