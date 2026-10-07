import { type ErrorBoundaryProps, Stack } from "expo-router";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { Suspense, useMemo } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import { LockProvider } from "@/components/LockProvider";
import { AppText, Button, Loading } from "@/components/ui";
import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrate";
import { SETTINGS, getSetting } from "@/db/settings";
import { generateDueExpenses } from "@/db/subscriptions";
import { todayIso } from "@/lib/date";
import i18n from "@/lib/i18n";
import { layout, spacing, useTheme } from "@/theme";

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const theme = useTheme();

  return (
    <View style={[styles.fill, styles.center, { backgroundColor: theme.bg }]}>
      <AppText variant="title" style={styles.text}>
        {i18n.t("common.error")}
      </AppText>
      <AppText tone="muted" style={styles.text}>
        {error.message}
      </AppText>
      <View style={styles.action}>
        <Button title={i18n.t("common.retry")} onPress={retry} />
      </View>
    </View>
  );
}

function Splash() {
  const theme = useTheme();

  return (
    <View style={[styles.fill, styles.center, { backgroundColor: theme.bg }]}>
      <Loading />
    </View>
  );
}

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
  await migrateDbIfNeeded(db);
  const language = await getSetting(db, SETTINGS.language);
  if (language) await i18n.changeLanguage(language);
  try {
    await generateDueExpenses(db, todayIso());
  } catch {}
}

export default function RootLayout() {
  return (
    <Suspense fallback={<Splash />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase} useSuspense>
        <LockProvider>
          <Navigator />
        </LockProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: layout.gutter,
  },
  text: {
    textAlign: "center",
  },
  action: {
    width: "100%",
    maxWidth: 320,
    marginTop: spacing.md,
  },
});
