import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Field, IconButton, ListRow } from "@/components/ui";
import { currencyName, currencyOptions, currencySymbol } from "@/lib/money";
import { layout, spacing, useTheme } from "@/theme";

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CurrencyPicker({ visible, selected, onSelect, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const options = useMemo(() => currencyOptions(), []);

  const q = query.trim().toUpperCase();
  const matches = options.filter(
    (code) => !q || code.includes(q) || currencyName(code, i18n.language).toUpperCase().includes(q)
  );
  const custom = /^[A-Z]{3}$/.test(q) && !options.includes(q) ? q : null;
  const data = custom ? [custom, ...matches] : matches;

  const choose = (code: string) => {
    onSelect(code);
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.bg, paddingTop: Platform.OS === "android" ? insets.top + spacing.md : spacing.lg },
        ]}
      >
        <View style={styles.header}>
          <AppText variant="title">{t("currency.title")}</AppText>
          <IconButton name="close" label={t("common.cancel")} onPress={onClose} />
        </View>
        <View style={styles.search}>
          <Field
            label={t("currency.search")}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={data}
          keyExtractor={(code) => code}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item, index }) => {
            const symbol = currencySymbol(item, i18n.language);
            return (
              <ListRow
                title={item}
                subtitle={currencyName(item, i18n.language)}
                value={symbol === item ? undefined : symbol}
                onPress={() => choose(item)}
                last={index === data.length - 1}
                trailing={
                  item === selected ? <Ionicons name="checkmark" size={20} color={theme.accent} /> : undefined
                }
              />
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.md,
  },
  search: {
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.sm,
  },
});
