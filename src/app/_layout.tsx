import { SQLiteProvider } from "expo-sqlite";
import { Stack } from "expo-router";

import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrate";
import "@/lib/i18n";

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack />
    </SQLiteProvider>
  );
}