import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { type ColorValue, StyleSheet } from "react-native";

import { useTheme } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const icon = (name: IconName) => {
  const TabIcon = ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
};

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home"), tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="history" options={{ title: t("tabs.history"), tabBarIcon: icon("time-outline") }} />
      <Tabs.Screen
        name="subscriptions"
        options={{ title: t("tabs.subscriptions"), tabBarIcon: icon("repeat-outline") }}
      />
    </Tabs>
  );
}
