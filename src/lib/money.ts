import { getLocales } from "expo-localization";

import i18nInstance from "@/lib/i18n";

export const FALLBACK_CURRENCY_CODE = "EUR";

export type CurrencyCode = string;

export function getDeviceCurrency(): CurrencyCode {
  return getLocales()[0]?.currencyCode ?? FALLBACK_CURRENCY_CODE;
}

export function fractionDigits(currencyCode: CurrencyCode): number {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency: currencyCode }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function minorUnitsToInput(minorUnits: number, currencyCode: CurrencyCode): string {
  const digits = fractionDigits(currencyCode);
  return (minorUnits / 10 ** digits).toFixed(digits);
}

export function formatMoney(
  minorUnits: number,
  currencyCode: CurrencyCode = getDeviceCurrency()
): string {
  return new Intl.NumberFormat(i18nInstance.language, { style: "currency", currency: currencyCode }).format(
    minorUnits / 10 ** fractionDigits(currencyCode)
  );
}

export function parseAmountToMinorUnits(
  input: string,
  currencyCode: CurrencyCode = getDeviceCurrency()
): number | null {
  const digits = fractionDigits(currencyCode);
  const match = input.trim().replace(",", ".").match(/^(\d+)(?:\.(\d*))?$/);
  if (!match || (match[2] ?? "").length > digits) return null;

  const fraction = Number((match[2] ?? "").padEnd(digits, "0") || 0);
  const minor = Number(match[1]) * 10 ** digits + fraction;
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}