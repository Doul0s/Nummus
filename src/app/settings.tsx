import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppText, ListRow, SectionHeader } from "@/components/ui";
import { SETTINGS, setSetting } from "@/db/settings";
import { layout, spacing, useTheme } from "@/theme";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
];

export default function Settings() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setSetting(db, SETTINGS.language, code);
  };

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
