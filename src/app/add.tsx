import { Stack, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useTranslation } from "react-i18next";

import { ExpenseForm } from "@/components/ExpenseForm";
import { insertExpense } from "@/db/expenses";

export default function Add() {
  const db = useSQLiteContext();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("add.title") }} />
      <ExpenseForm
        submitLabel={t("add.submit")}
        onSubmit={async (values) => {
          await insertExpense(db, values);
          router.back();
        }}
      />
    </>
  );
}