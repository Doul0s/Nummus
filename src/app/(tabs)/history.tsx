import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionList, StyleSheet, View } from "react-native";

import { ExpenseRow } from "@/components/ExpenseRow";
import {
  AddFab,
  EmptyState,
  Loading,
  ScreenHeader,
  SectionHeader,
} from "@/components/ui";
import { CurrencyTotal } from "@/db/dashboard";
import { Expense, getExpensesSince, getHistoryPage } from "@/db/expenses";
import { IsoDate, formatDayLabel } from "@/lib/date";
import { formatMoney } from "@/lib/money";

const PAGE_DAYS = 20;

type Section = { date: IsoDate; title: string; totals: CurrencyTotal[]; data: Expense[] };

function sumByCurrency(rows: Expense[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.currencyCode, (totals.get(row.currencyCode) ?? 0) + row.amountMinor);
  }
  return [...totals].map(([currencyCode, totalMinor]) => ({ currencyCode, totalMinor }));
}

function groupByDay(rows: Expense[], languageTag: string): Section[] {
  const byDay = new Map<IsoDate, Expense[]>();
  for (const row of rows) {
    const bucket = byDay.get(row.spentAt);
    if (bucket) bucket.push(row);
    else byDay.set(row.spentAt, [row]);
  }
  return [...byDay].map(([date, data]) => ({
    date,
    title: formatDayLabel(date, languageTag),
    totals: sumByCurrency(data),
    data,
  }));
}

export default function History() {
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<Expense[]>([]);
  const [cursor, setCursor] = useState<IsoDate | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const rowsRef = useRef<Expense[]>([]);
  const busy = useRef(false);

  const apply = (next: Expense[]) => {
    rowsRef.current = next;
    setRows(next);
  };

  const refresh = useCallback(async () => {
    try {
      const loaded = rowsRef.current;
      if (loaded.length === 0) {
        const page = await getHistoryPage(db, null, PAGE_DAYS);
        apply(page.rows);
        setCursor(page.nextCursor);
      } else {
        apply(await getExpensesSince(db, loaded[loaded.length - 1].spentAt));
      }
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const loadMore = async () => {
    if (cursor === null || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    try {
      const page = await getHistoryPage(db, cursor, PAGE_DAYS);
      apply([...rowsRef.current, ...page.rows]);
      setCursor(page.nextCursor);
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  };

  const sections = useMemo(() => groupByDay(rows, i18n.language), [rows, i18n.language]);

  return (
    <View style={styles.container}>
      <SectionList<Expense, Section>
        sections={sections}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.content}
        stickySectionHeadersEnabled={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<ScreenHeader title={t("history.title")} />}
        ListEmptyComponent={
          status === "loading" ? (
            <Loading />
          ) : status === "error" ? (
            <EmptyState
              title={t("common.error")}
              hint={t("common.tryAgain")}
              actionLabel={t("common.retry")}
              onAction={refresh}
            />
          ) : (
            <EmptyState
              title={t("index.empty")}
              hint={t("index.emptyHint")}
              actionLabel={t("index.addExpense")}
              onAction={() => router.push("/add")}
            />
          )
        }
        ListFooterComponent={loadingMore ? <Loading /> : null}
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
