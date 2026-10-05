import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { type ComponentProps, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type TypeVariant, layout, radius, spacing, typography, useTheme } from "@/theme";

type TextTone = "default" | "muted" | "accent" | "danger";

type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  numeric?: boolean;
};

export function AppText({ variant = "body", tone = "default", numeric, style, ...props }: AppTextProps) {
  const theme = useTheme();
  const color = { default: theme.text, muted: theme.muted, accent: theme.accent, danger: theme.danger }[tone];

  return <Text {...props} style={[typography[variant], { color }, numeric && styles.numeric, style]} />;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

export function Button({ title, onPress, variant = "primary", disabled }: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { background: theme.text, border: theme.text, text: theme.bg },
    secondary: { background: "transparent", border: theme.border, text: theme.text },
    danger: { background: "transparent", border: theme.border, text: theme.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="headline" style={{ color: colors.text }}>
        {title}
      </AppText>
    </Pressable>
  );
}

type IconName = ComponentProps<typeof Ionicons>["name"];

export function IconButton({ name, label, onPress }: { name: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
    >
      <Ionicons name={name} size={24} color={theme.text} />
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <AppText variant="overline" tone="muted">
      {children}
    </AppText>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Field({ label, error, style, onFocus, onBlur, ...input }: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        {...input}
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          typography.body,
          styles.fieldInput,
          {
            color: theme.text,
            borderBottomColor: error ? theme.danger : focused ? theme.accent : theme.border,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function AmountInput({ error, style, ...input }: TextInputProps & { error?: string }) {
  const theme = useTheme();

  return (
    <View>
      <TextInput
        {...input}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={theme.muted}
        selectionColor={theme.accent}
        style={[typography.display, styles.amountInput, { color: theme.text }, style]}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screenHeader, { paddingTop: insets.top + spacing.md }]}>
      <AppText variant="title">{title}</AppText>
      {right}
    </View>
  );
}

type StatProps = {
  label: string;
  values: string[];
  size?: "hero" | "regular";
};

export function Stat({ label, values, size = "regular" }: StatProps) {
  return (
    <View style={styles.stat}>
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
      {values.map((value) => (
        <AppText key={value} variant={size === "hero" ? "display" : "stat"} numeric>
          {value}
        </AppText>
      ))}
    </View>
  );
}

type SectionHeaderProps = {
  title: string;
  right?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, right, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="overline" tone="muted">
        {title}
      </AppText>
      {actionLabel ? (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onAction}>
          <AppText variant="caption" tone="accent">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : right ? (
        <AppText variant="caption" tone="muted" numeric>
          {right}
        </AppText>
      ) : null}
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
};

export function ListRow({ title, subtitle, value, trailing, onPress, last }: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowText}>
        <AppText numberOfLines={1}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText numeric style={styles.rowValue}>
          {value}
        </AppText>
      ) : null}
      {trailing}
    </Pressable>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <AppText variant="headline" style={styles.centered}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="caption" tone="muted" style={styles.centered}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.segmented, { borderColor: theme.border }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.text }]}
          >
            <AppText variant="caption" style={{ color: selected ? theme.bg : theme.text, fontWeight: "600" }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.toggleRow}>
      <AppText>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
      />
    </View>
  );
}

export function AddFab({ repeat }: { repeat?: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("index.add")}
      onPress={() => router.push(repeat ? { pathname: "/add", params: { repeat: "1" } } : "/add")}
      style={({ pressed }) => [styles.fab, { backgroundColor: theme.text, opacity: pressed ? 0.8 : 1 }]}
    >
      <AppText style={[styles.fabPlus, { color: theme.bg }]}>+</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  numeric: {
    fontVariant: ["tabular-nums"],
  },
  centered: {
    textAlign: "center",
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    gap: spacing.xs,
  },
  fieldInput: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  amountInput: {
    padding: 0,
    fontVariant: ["tabular-nums"],
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.gutter,
    paddingBottom: spacing.md,
  },
  stat: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginHorizontal: layout.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginHorizontal: layout.gutter,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
  },
  rowValue: {
    fontWeight: "600",
  },
  segmented: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  empty: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: layout.gutter,
  },
  fab: {
    position: "absolute",
    right: layout.gutter,
    bottom: layout.gutter,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabPlus: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "400",
  },
});
