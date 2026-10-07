import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { useLock } from "@/components/LockProvider";
import {
  AppText,
  FieldLabel,
  ListRow,
  SectionHeader,
  Segmented,
  ToggleRow,
} from "@/components/ui";
import { SETTINGS, setSetting } from "@/db/settings";
import { LOCK_AFTER_OPTIONS } from "@/lib/lock";
import { layout, spacing, useTheme } from "@/theme";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
];

export default function Settings() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const lock = useLock();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setSetting(db, SETTINGS.language, code);
  };

  const lockAfterLabel = (seconds: number) =>
    seconds === 0 ? t("settings.immediately") : t(seconds === 60 ? "settings.after1" : "settings.after5");

  return (
    <ScrollView>
      <Stack.Screen options={{ title: t("settings.title") }} />

      <SectionHeader title={t("settings.language")} />
      {LANGUAGES.map(({ code, name }, i) => (
        <ListRow
          key={code}
          title={name}
          last={i === LANGUAGES.length - 1}
          onPress={() => changeLanguage(code)}
          trailing={
            i18n.language.startsWith(code) ? (
              <Ionicons name="checkmark" size={20} color={theme.accent} />
            ) : undefined
          }
        />
      ))}

      <SectionHeader title={t("settings.security")} />
      <View style={styles.block}>
        <ToggleRow
          label={t("settings.lock")}
          value={lock.enabled}
          disabled={!lock.available}
          onValueChange={lock.setEnabled}
        />
        {lock.available ? null : (
          <AppText variant="caption" tone="muted">
            {t("settings.lockUnavailable")}
          </AppText>
        )}
        {lock.enabled && lock.available ? (
          <>
            <FieldLabel>{t("settings.lockAfter")}</FieldLabel>
            <Segmented
              value={String(lock.lockAfter)}
              onChange={(seconds) => lock.setLockAfter(Number(seconds))}
              options={LOCK_AFTER_OPTIONS.map((seconds) => ({
                value: String(seconds),
                label: lockAfterLabel(seconds),
              }))}
            />
          </>
        ) : null}
      </View>

      <SectionHeader title={t("settings.privacy")} />
      <View style={styles.block}>
        <AppText tone="muted">{t("settings.privacyText")}</AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: {
    marginHorizontal: layout.gutter,
    gap: spacing.sm,
  },
});
