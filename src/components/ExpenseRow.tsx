import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { ListRow } from "@/components/ui";
import type { Expense } from "@/db/expenses";
import { formatDayLabel } from "@/lib/date";
import { formatMoney } from "@/lib/money";

type Props = {
  expense: Expense;
  last?: boolean;
};

export function ExpenseRow({ expense, last }: Props) {
  const { t, i18n } = useTranslation();
  const day = formatDayLabel(expense.spentAt, i18n.language);

  return (
    <ListRow
      title={expense.label}
      subtitle={expense.recurringId === null ? day : `${day} · ${t("expense.recurring")}`}
      value={formatMoney(expense.amountMinor, expense.currencyCode)}
      last={last}
      onPress={() => router.push({ pathname: "/expense/[id]", params: { id: String(expense.id) } })}
    />
  );
}
