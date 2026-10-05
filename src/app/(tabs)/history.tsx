import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionList, StyleSheet, View } from "react-native";

import { ExpenseRow } from "@/components/ExpenseRow";
import { AddFab, EmptyState, ScreenHeader, SectionHeader } from "@/components/ui";
import { CurrencyTotal, Expense, listExpenses } from "@/db/expenses";
import { formatMonthLabel, monthKeyOf } from "@/lib/date";
import { formatMoney } from "@/lib/money";

type Section = { title: string; totals: CurrencyTotal[]; data: Expense[] };

function sumByCurrency(rows: Expense[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.currencyCode, (totals.get(row.currencyCode) ?? 0) + row.amountMinor);
  }
  return [...totals].map(([currencyCode, totalMinor]) => ({ currencyCode, totalMinor }));
}

function groupByMonth(rows: Expense[], languageTag: string): Section[] {
  const byMonth = new Map<string, Expense[]>();
  for (const row of rows) {
    const key = monthKeyOf(row.spentAt);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(row);
    else byMonth.set(key, [row]);
  }
  return [...byMonth].map(([key, data]) => ({
    title: formatMonthLabel(key, languageTag),
    totals: sumByCurrency(data),
    data,
  }));
}

export default function History() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState<Section[]>([]);

  useFocusEffect(
    useCallback(() => {
      listExpenses(db).then((rows) => setSections(groupByMonth(rows, i18n.language)));
    }, [db, i18n.language])
  );

  return (
    <View style={styles.container}>
      <SectionList<Expense, Section>
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={<ScreenHeader title={t("history.title")} />}
        ListEmptyComponent={<EmptyState title={t("index.empty")} hint={t("index.emptyHint")} />}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={section.title}
            right={section.totals.map((x) => formatMoney(x.totalMinor, x.currencyCode)).join(" · ")}
          />
        )}
        renderItem={({ item, index, section }) => (
          <ExpenseRow expense={item} last={index === section.data.length - 1} />
        )}
      />

      <AddFab />
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
});
