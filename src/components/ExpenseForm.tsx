import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CurrencyPicker } from "@/components/CurrencyPicker";
import {
  AmountInput,
  AppText,
  Button,
  Field,
  FieldLabel,
  Segmented,
  ToggleRow,
} from "@/components/ui";
import type { Expense, NewExpense } from "@/db/expenses";
import { IsoDate, formatDayLabel, fromIsoDate, todayIso, toIsoDate } from "@/lib/date";
import {
  currencySymbol,
  getDeviceCurrency,
  minorUnitsToInput,
  parseAmountToMinorUnits,
} from "@/lib/money";
import type { Interval } from "@/lib/recurring";
import { layout, radius, spacing, useTheme } from "@/theme";

type DateFieldProps = {
  value: IsoDate;
  allowFuture: boolean;
  onChange: (value: IsoDate) => void;
};

function DateField({ value, allowFuture, onChange }: DateFieldProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const date = fromIsoDate(value);
  const maximumDate = allowFuture ? undefined : new Date();

  const handleChange = (_: unknown, picked?: Date) => {
    if (picked) onChange(toIsoDate(picked));
  };

  if (Platform.OS === "ios") {
    return (
      <View style={styles.dateIos}>
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          maximumDate={maximumDate}
          accentColor={theme.accent}
          onChange={handleChange}
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      style={[styles.dateAndroid, { borderBottomColor: theme.border }]}
      onPress={() =>
        DateTimePickerAndroid.open({ value: date, mode: "date", maximumDate, onChange: handleChange })
      }
    >
      <AppText>{formatDayLabel(value, i18n.language)}</AppText>
    </Pressable>
  );
}

type Props = {
  initial?: Expense;
  defaultCurrency?: string;
  defaultRepeat?: boolean;
  submitLabel: string;
  onSubmit: (values: NewExpense, repeat: Interval | null) => Promise<void>;
  onDelete?: () => void;
};

type Errors = { amount?: string; label?: string };

export function ExpenseForm({
  initial,
  defaultCurrency,
  defaultRepeat,
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [currency, setCurrency] = useState(initial?.currencyCode ?? defaultCurrency ?? getDeviceCurrency());
  const [amount, setAmount] = useState(initial ? minorUnitsToInput(initial.amountMinor, currency) : "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [spentAt, setSpentAt] = useState(initial?.spentAt ?? todayIso());
  const [note, setNote] = useState(initial?.note ?? "");
  const [repeating, setRepeating] = useState(!initial && (defaultRepeat ?? false));
  const [period, setPeriod] = useState<Interval>("monthly");
  const [errors, setErrors] = useState<Errors>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  const submit = async () => {
    if (submitting.current) return;

    const amountMinor = parseAmountToMinorUnits(amount, currency);
    const next: Errors = {
      amount: amountMinor === null ? t("add.amountInvalid") : undefined,
      label: label.trim() === "" ? t("add.labelRequired") : undefined,
    };
    setErrors(next);
    if (amountMinor === null || next.label) return;

    submitting.current = true;
    setSaving(true);
    setSaveFailed(false);
    try {
      await onSubmit(
        {
          amountMinor,
          currencyCode: currency,
          label: label.trim(),
          note: repeating ? null : note.trim() || null,
          spentAt,
        },
        repeating ? period : null
      );
    } catch {
      setSaveFailed(true);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  const symbol = currencySymbol(currency, i18n.language);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable accessibilityRole="button" disabled={saving} hitSlop={12} onPress={submit}>
              <AppText variant="headline" tone="accent">
                {t("common.save")}
              </AppText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.amountRow}>
          <View style={styles.amount}>
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              autoFocus={!initial}
              error={errors.amount}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickerOpen(true)}
            style={[styles.chip, { borderColor: theme.border }]}
          >
            <AppText variant="headline">{symbol === currency ? currency : `${symbol} ${currency}`}</AppText>
            <Ionicons name="chevron-down" size={16} color={theme.muted} />
          </Pressable>
        </View>

        <Field
          label={t("add.label")}
          value={label}
          onChangeText={setLabel}
          placeholder={t("add.labelPlaceholder")}
          returnKeyType="done"
          error={errors.label}
        />

        <View style={styles.block}>
          <FieldLabel>{repeating ? t("add.starts") : t("add.date")}</FieldLabel>
          <DateField value={spentAt} allowFuture={repeating} onChange={setSpentAt} />
          {repeating && spentAt < todayIso() ? (
            <AppText variant="caption" tone="muted">
              {t("add.backfill")}
            </AppText>
          ) : null}
        </View>

        {initial ? null : (
          <View style={styles.block}>
            <ToggleRow label={t("add.repeats")} value={repeating} onValueChange={setRepeating} />
            {repeating ? (
              <Segmented
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "monthly", label: t("add.monthly") },
                  { value: "yearly", label: t("add.yearly") },
                ]}
              />
            ) : null}
          </View>
        )}

        {repeating ? null : (
          <Field
            label={t("add.note")}
            value={note}
            onChangeText={setNote}
            placeholder={t("add.note")}
            multiline
          />
        )}

        {saveFailed ? (
          <AppText variant="caption" tone="danger">
            {t("add.saveFailed")}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Button title={submitLabel} onPress={submit} disabled={saving} />
          {onDelete ? <Button title={t("common.delete")} onPress={onDelete} variant="danger" /> : null}
        </View>
      </ScrollView>

      <CurrencyPicker
        visible={pickerOpen}
        selected={currency}
        onSelect={setCurrency}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: layout.gutter,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  amount: {
    flex: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.compact,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  block: {
    gap: spacing.sm,
  },
  dateIos: {
    alignSelf: "flex-start",
    marginLeft: -spacing.sm,
  },
  dateAndroid: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
