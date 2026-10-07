import type { IsoDate } from "@/lib/date";

export type Interval = "monthly" | "yearly";

export type Schedule = {
  startDate: IsoDate;
  interval: Interval;
};

const pad = (n: number) => String(n).padStart(2, "0");

function dueDate({ startDate, interval }: Schedule, occurrence: number): IsoDate {
  const [year, month, day] = startDate.split("-").map(Number);
  const months = month - 1 + occurrence * (interval === "monthly" ? 1 : 12);
  const y = year + Math.floor(months / 12);
  const m = months % 12;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return `${y}-${pad(m + 1)}-${pad(Math.min(day, lastDay))}`;
}

export function dueDates(schedule: Schedule, after: IsoDate | null, through: IsoDate): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let n = 0; ; n++) {
    const due = dueDate(schedule, n);
    if (due > through) return dates;
    if (after === null || due > after) dates.push(due);
  }
}

export function nextRenewal(schedule: Schedule, today: IsoDate): IsoDate {
  let n = 0;
  while (dueDate(schedule, n) <= today) n++;
  return dueDate(schedule, n);
}
