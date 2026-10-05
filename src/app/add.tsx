import { Stack, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ExpenseForm } from "@/components/ExpenseForm";
import { insertExpense, lastUsedCurrency } from "@/db/expenses";
import { getDeviceCurrency } from "@/lib/money";

export default function Add() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
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
          submitLabel={t("add.submit")}
          onSubmit={async (values) => {
            await insertExpense(db, values);
            router.back();
          }}
        />
      ) : null}
    </>
  );
}
