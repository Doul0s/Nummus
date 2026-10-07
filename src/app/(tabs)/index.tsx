import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { ExpenseRow } from "@/components/ExpenseRow";
import {
  AddFab,
  EmptyState,
  IconButton,
  Loading,
  ScreenHeader,
  SectionHeader,
  Stat,
} from "@/components/ui";
import { CurrencyTotal, getDashboard } from "@/db/dashboard";
import { generateDueExpenses } from "@/db/subscriptions";
import { formatDayLabel, getDeviceFirstWeekday, todayIso } from "@/lib/date";
import { formatMoney, getDeviceCurrency } from "@/lib/money";
import { useFocusLoad } from "@/lib/useFocusLoad";
import { layout, spacing } from "@/theme";

const RECENT_LIMIT = 6;

const amounts = (totals: CurrencyTotal[]): string[] =>
  (totals.length > 0 ? totals : [{ currencyCode: getDeviceCurrency(), totalMinor: 0 }]).map((x) =>
    formatMoney(x.totalMinor, x.currencyCode)
  );

export default function Home() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();

  const load = useCallback(async () => {
    const today = todayIso();
    await generateDueExpenses(db, today);
    return getDashboard(db, today, getDeviceFirstWeekday(), RECENT_LIMIT);
  }, [db]);
  const { data, failed, reload } = useFocusLoad(load, true);

  const next = data?.nextRenewal;

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

        {data === null ? (
          failed ? (
            <EmptyState
              title={t("common.error")}
              hint={t("common.tryAgain")}
              actionLabel={t("common.retry")}
              onAction={reload}
            />
          ) : (
            <Loading />
          )
        ) : (
          <>
            <View style={styles.overview}>
              <Stat label={t("index.thisMonth")} values={amounts(data.month)} size="hero" />
              <View style={styles.statRow}>
                <Stat label={t("index.thisWeek")} values={amounts(data.week)} style={styles.stat} />
                <Stat
                  label={t("index.recurring")}
                  values={amounts(data.recurring)}
                  caption={
                    next
                      ? t("index.nextRenewal", {
                          label: next.label,
                          when: formatDayLabel(next.date, i18n.language),
                        })
                      : undefined
                  }
                  style={styles.stat}
                />
              </View>
            </View>

            <SectionHeader
              title={t("index.recent")}
              actionLabel={data.recent.length > 0 ? t("index.seeAll") : undefined}
              onAction={() => router.navigate("/history")}
            />
            {data.recent.length === 0 ? (
              <EmptyState
                title={t("index.empty")}
                hint={t("index.emptyHint")}
                actionLabel={t("index.addExpense")}
                onAction={() => router.push("/add")}
              />
            ) : (
              data.recent.map((expense, i) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  showDate
                  last={i === data.recent.length - 1}
                />
              ))
            )}
          </>
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
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
  },
});
