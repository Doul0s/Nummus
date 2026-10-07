import { getCalendars } from "expo-localization";

import i18nInstance from "@/lib/i18n";

export type IsoDate = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function getDeviceFirstWeekday(): number {
  return getCalendars()[0]?.firstWeekday ?? 1;
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(isoDate: IsoDate): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000);
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

export function weekRange(
  isoDate: IsoDate,
  firstWeekday: number
): { startIso: IsoDate; endIso: IsoDate } {
  const date = fromIsoDate(isoDate);
  const offset = (date.getDay() - (firstWeekday - 1) + 7) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { startIso: toIsoDate(start), endIso: toIsoDate(end) };
}

export function formatDayLabel(isoDate: IsoDate, languageTag: string): string {
  if (isoDate === todayIso()) return i18nInstance.t("expense.today");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toIsoDate(yesterday)) return i18nInstance.t("expense.yesterday");

  const date = fromIsoDate(isoDate);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(languageTag, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}
