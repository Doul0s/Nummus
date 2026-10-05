import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/migrate";
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

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Navigator />
    </SQLiteProvider>
  );
}
