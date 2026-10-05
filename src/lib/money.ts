import { getLocales } from "expo-localization";

import { i18n } from "@/lib/i18n";

const FALLBACK_CURRENCY_CODE = "EUR";

// Space variants and apostrophes used as thousands separators by locale keyboards.
const GROUPING_CHARS = /[\s\u00a0\u202f\u2009']/g;

const COMMON_CURRENCIES = [
  "MAD", "EUR", "USD", "GBP", "CAD", "CHF", "AED", "SAR", "DZD", "TND", "EGP", "TRY", "JPY", "CNY",
  "INR", "AUD", "NZD", "SEK", "NOK", "DKK", "PLN", "BRL", "MXN", "ZAR", "NGN", "XOF", "KWD", "QAR",
];

export type CurrencyCode = string;

export function getDeviceCurrency(): CurrencyCode {
  return getLocales()[0]?.currencyCode ?? FALLBACK_CURRENCY_CODE;
}

export function currencyOptions(): CurrencyCode[] {
  return [...new Set([getDeviceCurrency(), ...COMMON_CURRENCIES])];
}

export function currencyName(code: CurrencyCode, languageTag: string): string {
  try {
    return new Intl.DisplayNames([languageTag], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function fractionDigits(currencyCode: CurrencyCode): number {
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
  return new Intl.NumberFormat(i18n.language, { style: "currency", currency: currencyCode }).format(
    minorUnits / 10 ** fractionDigits(currencyCode)
  );
}

export function parseAmountToMinorUnits(
  input: string,
  currencyCode: CurrencyCode = getDeviceCurrency()
): number | null {
  const digits = fractionDigits(currencyCode);
  const text = input.trim().replace(GROUPING_CHARS, "");
  if (text === "") return null;

  const mark = Math.max(text.lastIndexOf("."), text.lastIndexOf(","));
  // The rightmost separator is the decimal mark, unless exactly three digits
  // follow it and it is therefore a thousands group ("1,234" vs "12,5").
  const isDecimal = mark !== -1 && text.length - mark - 1 !== 3;
  const whole = isDecimal ? text.slice(0, mark) : text;
  const fraction = isDecimal ? text.slice(mark + 1) : "";

  // Any remaining separator in the integer part must form whole thousands groups.
  const grouped = /^\d{1,3}(?:[.,]\d{3})+$/.test(whole);
  if (!grouped && !/^\d*$/.test(whole)) return null;
  if (!/^\d*$/.test(fraction) || fraction.length > digits) return null;

  const minor =
    Number(whole.replace(/[.,]/g, "") || 0) * 10 ** digits + Number(fraction.padEnd(digits, "0"));
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}
