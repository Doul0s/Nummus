import { getCalendars } from "expo-localization";
import i18nInstance from "@/lib/i18n";


export type IsoDate = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function getDeviceTimeZone(): string | null {
  return getCalendars()[0]?.timeZone ?? null;
}

export function getDeviceFirstWeekday(): number {
  return getCalendars()[0]?.firstWeekday ?? 1;
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function monthKeyOf(isoDate: IsoDate): string {
  return isoDate.slice(0, 7);
}

export function monthRange(monthKey: string): { startIso: IsoDate; endIso: IsoDate } {
  const [y, m] = monthKey.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return { startIso: `${monthKey}-01`, endIso: `${next}-01` };
}

export function formatMonthLabel(monthKey: string, languageTag: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(languageTag, { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  ); // note: keeping function signature as is; also ensure we don't need i18n here? We don't use i18nInstance now

}

export function formatDayLabel(isoDate: IsoDate, languageTag: string): string {
  if (isoDate === todayIso()) return i18nInstance.t("expense.today");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toIsoDate(yesterday)) return i18nInstance.t("expense.yesterday");

  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}