import { type TextStyle, useColorScheme } from "react-native";

const palette = {
  light: {
    bg: "#F7F5F0",
    text: "#14130F",
    muted: "#7A766B",
    border: "#E2DED3",
    accent: "#2F5D50",
    danger: "#B3402F",
  },
  dark: {
    bg: "#0F0F0D",
    text: "#F2EFE8",
    muted: "#8C887C",
    border: "#2A2923",
    accent: "#7FB5A3",
    danger: "#E0806F",
  },
};

export const spacing = { xs: 4, sm: 8, compact: 12, md: 16, lg: 24, xl: 40 };

export const radius = { sm: 6, md: 10 };

export const layout = { gutter: spacing.lg };

export const tabularNums: TextStyle = { fontVariant: ["tabular-nums"] };

export type TypeVariant = "amountXL" | "amount" | "title" | "headline" | "body" | "caption" | "section";

export const typography: Record<TypeVariant, TextStyle> = {
  amountXL: { fontSize: 44, lineHeight: 50, fontWeight: "600", letterSpacing: -1, fontVariant: ["tabular-nums"] },
  amount: { fontSize: 24, lineHeight: 30, fontWeight: "600", letterSpacing: -0.4, fontVariant: ["tabular-nums"] },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.5 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 22, fontWeight: "400" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  section: { fontSize: 12, lineHeight: 16, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
};

export type Theme = typeof palette.light;

export function useTheme(): Theme {
  return palette[useColorScheme() === "dark" ? "dark" : "light"];
}
