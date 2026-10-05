import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { ExpenseForm } from "@/components/ExpenseForm";
import { Expense, deleteExpense, getExpense, updateExpense } from "@/db/expenses";

export default function EditExpense() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = Number(id);
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    getExpense(db, expenseId).then((found) => (found ? setExpense(found) : router.back()));
  }, [db, expenseId]);

  const confirmDelete = () =>
    Alert.alert(t("expense.deleteTitle"), t("expense.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await deleteExpense(db, expenseId);
          router.back();
        },
      },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: t("edit.title") }} />
      {expense ? (
        <ExpenseForm
          initial={expense}
          submitLabel={t("common.save")}
          onSubmit={async (values) => {
            await updateExpense(db, expenseId, values);
            router.back();
          }}
          onDelete={confirmDelete}
        />
      ) : null}
    </>
  );
}
