import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { AddFab, EmptyState, ListRow, ScreenHeader, SectionHeader, Stat } from "@/components/ui";
import {
  RecurringTemplate,
  deleteRecurring,
  listRecurring,
  setRecurringActive,
} from "@/db/recurring";
import { formatDayLabel, todayIso } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import { monthlyEquivalent, nextRenewal } from "@/lib/recurring";
import { layout, spacing } from "@/theme";

function monthlyCosts(templates: RecurringTemplate[]): string[] {
  const totals = new Map<string, number>();
  for (const template of templates) {
    totals.set(
      template.currencyCode,
      (totals.get(template.currencyCode) ?? 0) + monthlyEquivalent(template.amountMinor, template.interval)
    );
  }
  return [...totals].map(([code, minor]) => formatMoney(minor, code));
}

export default function Subscriptions() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<RecurringTemplate[]>([]);

  const load = useCallback(async () => setItems(await listRecurring(db)), [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const manage = (item: RecurringTemplate) =>
    Alert.alert(item.label, t("subscriptions.manageHint"), [
      {
        text: item.active ? t("subscriptions.pause") : t("subscriptions.resume"),
        onPress: async () => {
          await setRecurringActive(db, item.id, !item.active, todayIso());
          load();
        },
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteRecurring(db, item.id);
          load();
        },
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  const renderRows = (list: RecurringTemplate[]) =>
    list.map((item, i) => {
      const period = t(item.interval === "monthly" ? "add.monthly" : "add.yearly");
      const status = item.active
        ? t("subscriptions.next", {
            date: formatDayLabel(nextRenewal(item, todayIso()), i18n.language),
          })
        : t("subscriptions.paused");
      return (
        <ListRow
          key={item.id}
          title={item.label}
          subtitle={`${period} · ${status}`}
          value={formatMoney(item.amountMinor, item.currencyCode)}
          last={i === list.length - 1}
          onPress={() => manage(item)}
        />
      );
    });

  const active = items.filter((item) => item.active);
  const paused = items.filter((item) => !item.active);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t("subscriptions.title")} />

        {items.length === 0 ? (
          <EmptyState title={t("subscriptions.empty")} hint={t("subscriptions.emptyHint")} />
        ) : (
          <>
            {active.length > 0 ? (
              <View style={styles.summary}>
                <Stat label={t("subscriptions.perMonth")} values={monthlyCosts(active)} />
              </View>
            ) : null}

            {active.length > 0 ? <SectionHeader title={t("subscriptions.active")} /> : null}
            {renderRows(active)}

            {paused.length > 0 ? <SectionHeader title={t("subscriptions.paused")} /> : null}
            {renderRows(paused)}
          </>
        )}
      </ScrollView>

      <AddFab repeat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 112,
  },
  summary: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.sm,
  },
});
