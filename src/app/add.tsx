import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExpenseForm } from "@/components/ExpenseForm";
import { insertExpense, lastUsedCurrency } from "@/db/expenses";
import { generateDueExpenses, insertRecurring } from "@/db/recurring";
import { todayIso } from "@/lib/date";
import { getDeviceCurrency } from "@/lib/money";

export default function Add() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { repeat } = useLocalSearchParams<{ repeat?: string }>();
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    lastUsedCurrency(db).then((code) => setCurrency(code ?? getDeviceCurrency()));
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
            router.back();
          }}
        />
      ) : null}
    </>
  );
}
