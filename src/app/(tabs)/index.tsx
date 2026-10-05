import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { ExpenseRow } from "@/components/ExpenseRow";
import { AddFab, EmptyState, IconButton, ScreenHeader, SectionHeader, Stat } from "@/components/ui";
import { CurrencyTotal, Expense, listRecentExpenses, sumExpensesByCurrency } from "@/db/expenses";
import { getDeviceFirstWeekday, monthKeyOf, monthRange, todayIso, weekRange } from "@/lib/date";
import { formatMoney, getDeviceCurrency } from "@/lib/money";
import { layout, spacing } from "@/theme";

const RECENT_LIMIT = 6;

const amounts = (totals: CurrencyTotal[]): string[] =>
  (totals.length > 0 ? totals : [{ currencyCode: getDeviceCurrency(), totalMinor: 0 }]).map((x) =>
    formatMoney(x.totalMinor, x.currencyCode)
  );

export default function Home() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [monthTotals, setMonthTotals] = useState<CurrencyTotal[]>([]);
  const [weekTotals, setWeekTotals] = useState<CurrencyTotal[]>([]);
  const [recent, setRecent] = useState<Expense[]>([]);

  useFocusEffect(
    useCallback(() => {
      const today = todayIso();
      sumExpensesByCurrency(db, monthRange(monthKeyOf(today))).then(setMonthTotals);
      sumExpensesByCurrency(db, weekRange(today, getDeviceFirstWeekday())).then(setWeekTotals);
      listRecentExpenses(db, RECENT_LIMIT).then(setRecent);
    }, [db])
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Nummus"
          right={
            <IconButton
              name="settings-outline"
              label={t("settings.title")}
              onPress={() => router.push("/settings")}
            />
          }
        />

        <View style={styles.overview}>
          <Stat label={t("index.thisMonth")} values={amounts(monthTotals)} size="hero" />
          <View style={styles.statRow}>
            <Stat label={t("index.thisWeek")} values={amounts(weekTotals)} />
          </View>
        </View>

        <SectionHeader
          title={t("index.recent")}
          actionLabel={recent.length > 0 ? t("index.seeAll") : undefined}
          onAction={() => router.navigate("/history")}
        />
        {recent.length === 0 ? (
          <EmptyState title={t("index.empty")} hint={t("index.emptyHint")} />
        ) : (
          recent.map((expense, i) => (
            <ExpenseRow key={expense.id} expense={expense} last={i === recent.length - 1} />
          ))
        )}
      </ScrollView>

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
  overview: {
    paddingHorizontal: layout.gutter,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
});
