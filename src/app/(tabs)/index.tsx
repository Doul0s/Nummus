import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppState, ScrollView, StyleSheet, View } from "react-native";

import { ExpenseRow } from "@/components/ExpenseRow";
import { AddFab, EmptyState, IconButton, ScreenHeader, SectionHeader, Stat } from "@/components/ui";
import { CurrencyTotal, Expense, listRecentExpenses, sumExpensesByCurrency } from "@/db/expenses";
import { generateDueExpenses } from "@/db/recurring";
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
  const [recurringTotals, setRecurringTotals] = useState<CurrencyTotal[]>([]);
  const [recent, setRecent] = useState<Expense[]>([]);

  const load = useCallback(async () => {
    const today = todayIso();
    try {
      await generateDueExpenses(db, today);
    } catch (error) {
      // Keep showing what we already have; the totals below are still worth fetching.
      console.warn("Nummus: recurring expense generation failed", error);
    }
    const month = monthRange(monthKeyOf(today));
    try {
      const [monthly, weekly, recurring, latest] = await Promise.all([
        sumExpensesByCurrency(db, month),
        sumExpensesByCurrency(db, weekRange(today, getDeviceFirstWeekday())),
        sumExpensesByCurrency(db, month, true),
        listRecentExpenses(db, RECENT_LIMIT),
      ]);
      setMonthTotals(monthly);
      setWeekTotals(weekly);
      setRecurringTotals(recurring);
      setRecent(latest);
    } catch (error) {
      // Both callers fire and forget, so this must never reject unhandled.
      console.warn("Nummus: home refresh failed", error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") load();
    });
    return () => subscription.remove();
  }, [load]);

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
            <Stat label={t("index.recurring")} values={amounts(recurringTotals)} />
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
