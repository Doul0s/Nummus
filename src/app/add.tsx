import { Stack, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { insertExpense } from "@/db/expenses";
import { todayIso } from "@/lib/date";
import { getDeviceCurrency, parseAmountToMinorUnits } from "@/lib/money";

export default function Add() {
  const db = useSQLiteContext();
  const { t } = useTranslation();

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(getDeviceCurrency());
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!/^[A-Z]{3}$/.test(currency)) return setError(t("add.currencyInvalid"));

    const amountMinor = parseAmountToMinorUnits(amount, currency);
    if (amountMinor === null) return setError(t("add.amountInvalid"));
    if (label.trim() === "") return setError(t("add.labelRequired"));

    await insertExpense(db, {
      amountMinor,
      currencyCode: currency,
      label: label.trim(),
      note: note.trim() || null,
      spentAt: todayIso(),
    });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("add.title") }} />

      <Text style={styles.fieldLabel}>{t("add.amount")}</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder={t("add.amount")}
        keyboardType="decimal-pad"
        returnKeyType="next"
      />

      <Text style={styles.fieldLabel}>{t("add.currency")}</Text>
      <TextInput
        style={styles.input}
        value={currency}
        onChangeText={(c) => setCurrency(c.toUpperCase())}
        autoCapitalize="characters"
        maxLength={3}
        returnKeyType="next"
      />

      <Text style={styles.fieldLabel}>{t("add.label")}</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder={t("add.label")}
        returnKeyType="next"
      />

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
        <Text style={styles.cancel} onPress={() => router.back()}>
          {t("common.cancel")}
        </Text>
        <Text style={styles.submit} onPress={onSubmit}>
          {t("add.submit")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: "flex-end",
    gap: 20,
    marginTop: 24,
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