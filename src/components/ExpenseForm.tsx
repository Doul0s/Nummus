import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { DateField } from "@/components/DateField";
import type { Expense, NewExpense } from "@/db/expenses";
import { todayIso } from "@/lib/date";
import { getDeviceCurrency, minorUnitsToInput, parseAmountToMinorUnits } from "@/lib/money";

type Props = {
  initial?: Expense;
  submitLabel: string;
  onSubmit: (values: NewExpense) => Promise<void>;
  onDelete?: () => void;
};

export function ExpenseForm({ initial, submitLabel, onSubmit, onDelete }: Props) {
  const { t } = useTranslation();

  const [amount, setAmount] = useState(
    initial ? minorUnitsToInput(initial.amountMinor, initial.currencyCode) : ""
  );
  const [currency, setCurrency] = useState(initial?.currencyCode ?? getDeviceCurrency());
  const [label, setLabel] = useState(initial?.label ?? "");
  const [spentAt, setSpentAt] = useState(initial?.spentAt ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!/^[A-Z]{3}$/.test(currency)) return setError(t("add.currencyInvalid"));

    const amountMinor = parseAmountToMinorUnits(amount, currency);
    if (amountMinor === null) return setError(t("add.amountInvalid"));
    if (label.trim() === "") return setError(t("add.labelRequired"));

    await onSubmit({
      amountMinor,
      currencyCode: currency,
      label: label.trim(),
      note: note.trim() || null,
      spentAt,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>{t("add.amount")}</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder={t("add.amount")}
        keyboardType="decimal-pad"
      />

      <Text style={styles.fieldLabel}>{t("add.currency")}</Text>
      <TextInput
        style={styles.input}
        value={currency}
        onChangeText={(c) => setCurrency(c.toUpperCase())}
        autoCapitalize="characters"
        maxLength={3}
      />

      <Text style={styles.fieldLabel}>{t("add.label")}</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder={t("add.label")}
      />

      <Text style={styles.fieldLabel}>{t("add.date")}</Text>
      <DateField value={spentAt} onChange={setSpentAt} />

      <Text style={styles.fieldLabel}>{t("add.note")}</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder={t("add.note")}
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {onDelete ? (
          <Text style={styles.delete} onPress={onDelete}>
            {t("common.delete")}
          </Text>
        ) : null}
        <View style={styles.spacer} />
        <Text style={styles.cancel} onPress={() => router.back()}>
          {t("common.cancel")}
        </Text>
        <Text style={styles.submit} onPress={submit}>
          {submitLabel}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.35)",
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 24,
  },
  spacer: {
    flex: 1,
  },
  delete: {
    fontSize: 16,
    color: "#c0392b",
  },
  cancel: {
    fontSize: 16,
    opacity: 0.6,
  },
  submit: {
    fontSize: 16,
    fontWeight: "600",
  },
});