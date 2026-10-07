import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import {
  AddFab,
  EmptyState,
  ListRow,
  Loading,
  ScreenHeader,
  SectionHeader,
  Stat,
} from "@/components/ui";
import { CurrencyTotal, getSubscriptionTotals } from "@/db/dashboard";
import {
  RecurringTemplate,
  deleteRecurring,
  listRecurring,
  setRecurringActive,
} from "@/db/subscriptions";
import { IsoDate, daysBetween, formatDayLabel, todayIso } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import { nextRenewal } from "@/lib/recurring";
import { useFocusLoad } from "@/lib/useFocusLoad";
import { layout, spacing } from "@/theme";

const SOON_DAYS = 30;

const amounts = (totals: CurrencyTotal[]): string[] =>
  totals.map((x) => formatMoney(x.totalMinor, x.currencyCode));

type Upcoming = { item: RecurringTemplate; next: IsoDate };

export default function Subscriptions() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();

  const load = useCallback(async () => {
    const [items, totals] = await Promise.all([listRecurring(db), getSubscriptionTotals(db)]);
    return { items, totals };
  }, [db]);
  const { data, failed, reload } = useFocusLoad(load);

  const today = todayIso();

  const when = (date: IsoDate) => {
    const days = daysBetween(today, date);
    if (days === 1) return t("subscriptions.tomorrow");
    return days <= SOON_DAYS ? t("subscriptions.inDays", { days }) : formatDayLabel(date, i18n.language);
  };

  const run = (action: () => Promise<void>) =>
    action()
      .then(reload)
      .catch(() => Alert.alert(t("common.error"), t("common.tryAgain")));

  const manage = (item: RecurringTemplate) =>
    Alert.alert(item.label, t("subscriptions.manageHint"), [
      {
        text: item.active ? t("subscriptions.pause") : t("subscriptions.resume"),
        onPress: () => run(() => setRecurringActive(db, item.id, !item.active, todayIso())),
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => run(() => deleteRecurring(db, item.id)),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  const period = (item: RecurringTemplate) => t(item.interval === "monthly" ? "add.monthly" : "add.yearly");

  const renderRow = (item: RecurringTemplate, subtitle: string, last: boolean, dim = false) => (
    <ListRow
      key={item.id}
      title={item.label}
      subtitle={subtitle}
      value={formatMoney(item.amountMinor, item.currencyCode)}
      dim={dim}
      last={last}
      onPress={() => manage(item)}
    />
  );

  const upcoming: Upcoming[] = (data?.items ?? [])
    .filter((item) => item.active)
    .map((item) => ({ item, next: nextRenewal(item, today) }))
    .sort((a, b) => a.next.localeCompare(b.next));
  const soon = upcoming.filter((u) => daysBetween(today, u.next) <= SOON_DAYS);
  const later = upcoming.filter((u) => daysBetween(today, u.next) > SOON_DAYS);
  const paused = (data?.items ?? []).filter((item) => !item.active);
  const first = upcoming[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t("subscriptions.title")} />

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
        ) : data.items.length === 0 ? (
          <EmptyState
            title={t("subscriptions.empty")}
            hint={t("subscriptions.emptyHint")}
            actionLabel={t("subscriptions.add")}
            onAction={() => router.push({ pathname: "/add", params: { repeat: "1" } })}
          />
        ) : (
          <>
            {first ? (
              <View style={styles.summary}>
                <Stat label={t("subscriptions.perMonth")} values={amounts(data.totals.monthly)} size="hero" />
                <View style={styles.statRow}>
                  <Stat
                    label={t("subscriptions.perYear")}
                    values={amounts(data.totals.yearly)}
                    style={styles.stat}
                  />
                  <Stat
                    label={t("subscriptions.nextRenewal")}
                    values={[formatMoney(first.item.amountMinor, first.item.currencyCode)]}
                    caption={`${first.item.label} · ${when(first.next)}`}
                    style={styles.stat}
                  />
                </View>
              </View>
            ) : null}

            {soon.length > 0 ? <SectionHeader title={t("subscriptions.comingUp")} /> : null}
            {soon.map(({ item, next }, i) =>
              renderRow(item, `${when(next)} · ${period(item)}`, i === soon.length - 1)
            )}

            {later.length > 0 ? <SectionHeader title={t("subscriptions.later")} /> : null}
            {later.map(({ item, next }, i) =>
              renderRow(item, `${when(next)} · ${period(item)}`, i === later.length - 1)
            )}

            {paused.length > 0 ? <SectionHeader title={t("subscriptions.paused")} /> : null}
            {paused.map((item, i) =>
              renderRow(item, `${period(item)} · ${t("subscriptions.paused")}`, i === paused.length - 1, true)
            )}
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
