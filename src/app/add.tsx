import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExpenseForm } from "@/components/ExpenseForm";
import { insertExpense } from "@/db/expenses";
import { SETTINGS, getSetting, setSetting } from "@/db/settings";
import { generateDueExpenses, insertRecurring } from "@/db/subscriptions";
import { todayIso } from "@/lib/date";
import { getDeviceCurrency } from "@/lib/money";

export default function Add() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { repeat } = useLocalSearchParams<{ repeat?: string }>();
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    getSetting(db, SETTINGS.currency)
      .then((code) => setCurrency(code ?? getDeviceCurrency()))
      .catch(() => setCurrency(getDeviceCurrency()));
  }, [db]);

  return (
    <>
      <Stack.Screen options={{ title: t("add.title") }} />
      {currency ? (
        <ExpenseForm
          defaultCurrency={currency}
          defaultRepeat={repeat === "1"}
          submitLabel={t("add.submit")}
          onSubmit={async (values, interval) => {
            if (interval) {
              await insertRecurring(db, {
                label: values.label,
                amountMinor: values.amountMinor,
                currencyCode: values.currencyCode,
                interval,
                startDate: values.spentAt,
              });
              await generateDueExpenses(db, todayIso());
            } else {
              await insertExpense(db, values);
            }
            await setSetting(db, SETTINGS.currency, values.currencyCode).catch(() => {});
            router.back();
          }}
        />
      ) : null}
    </>
  );
}
