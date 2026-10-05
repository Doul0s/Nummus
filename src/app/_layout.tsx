import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrate";
import { generateDueExpenses } from "@/db/recurring";
import { todayIso } from "@/lib/date";
import "@/lib/i18n";
import { useTheme } from "@/theme";

function Navigator() {
  const theme = useTheme();
  const dark = useColorScheme() === "dark";

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark,
      colors: {
        ...DefaultTheme.colors,
        background: theme.bg,
        card: theme.bg,
        text: theme.text,
        border: theme.border,
        primary: theme.accent,
      },
    }),
    [theme, dark]
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}

async function initDatabase(db: SQLiteDatabase) {
  // A failed migration propagates: an unusable schema should fail fast here rather
  // than surface later as every query throwing against a half-built table.
  await migrateDbIfNeeded(db);

  // Generation writes rows on every cold start, so it must never block booting.
  // The home screen retries it on the next foreground.
  try {
    await generateDueExpenses(db, todayIso());
  } catch (error) {
    console.warn("Nummus: recurring expense generation failed", error);
  }
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
      <Navigator />
    </SQLiteProvider>
  );
}
