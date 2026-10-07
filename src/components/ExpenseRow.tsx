import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { ListRow } from "@/components/ui";
import type { Expense } from "@/db/expenses";
import { formatDayLabel } from "@/lib/date";
import { formatMoney } from "@/lib/money";

type Props = {
  expense: Expense;
  showDate?: boolean;
  last?: boolean;
};

export function ExpenseRow({ expense, showDate, last }: Props) {
  const { t, i18n } = useTranslation();
  const meta = [
    showDate ? formatDayLabel(expense.spentAt, i18n.language) : null,
    expense.recurringId === null ? null : t("expense.recurring"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      title={expense.label}
      subtitle={meta || undefined}
      value={formatMoney(expense.amountMinor, expense.currencyCode)}
      last={last}
      onPress={() => router.push({ pathname: "/expense/[id]", params: { id: String(expense.id) } })}
    />
  );
}
