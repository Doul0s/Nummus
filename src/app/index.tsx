import { Link, Stack, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionList, StyleSheet, Text, View } from "react-native";

import { CurrencyTotal, Expense, listExpenses, sumExpensesByCurrency } from "@/db/expenses";
import { formatDayLabel, formatMonthLabel, monthKeyOf, monthRange, todayIso } from "@/lib/date";
import { formatMoney } from "@/lib/money";

type Section = { title: string; data: Expense[] };

function groupByMonth(rows: Expense[], languageTag: string): Section[] {
  const byMonth = new Map<string, Expense[]>();
  for (const row of rows) {
    const key = monthKeyOf(row.spentAt);
    const bucket = byMonth.get(key);
    if (bucket) bucket.push(row);
    else byMonth.set(key, [row]);
  }
  return [...byMonth].map(([key, data]) => ({ title: formatMonthLabel(key, languageTag), data }));
}

export default function Index() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const [sections, setSections] = useState<Section[]>([]);
  const [totals, setTotals] = useState<CurrencyTotal[]>([]);

  useFocusEffect(
    useCallback(() => {
      listExpenses(db).then((rows) => setSections(groupByMonth(rows, i18n.language)));
      sumExpensesByCurrency(db, monthRange(monthKeyOf(todayIso()))).then(setTotals);
    }, [db, i18n.language])
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("index.title") }} />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t("index.empty")}</Text>
          <Text style={styles.emptyHint}>{t("index.emptyHint")}</Text>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          sections={sections}
          keyExtractor={(e) => String(e.id)}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text>{item.label}</Text>
                <Text style={styles.rowDate}>{formatDayLabel(item.spentAt, i18n.language)}</Text>
              </View>
              <Text>{formatMoney(item.amountMinor, item.currencyCode)}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>{t("index.thisMonth")}</Text>
        <View style={styles.totals}>
          {totals.map((x) => (
            <Text key={x.currencyCode} style={styles.totalValue}>
              {formatMoney(x.totalMinor, x.currencyCode)}
            </Text>
          ))}
        </View>
      </View>

      <Link href="/add" style={styles.addButton}>
        <Text style={styles.addButtonText}>{t("index.add")}</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  list: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  rowDate: {
    fontSize: 13,
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 15,
    opacity: 0.6,
  },
  totals: {
    alignItems: "flex-end",
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "600",
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});