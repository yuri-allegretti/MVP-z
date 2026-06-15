const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function dateKey(date: Date): string {
  return toDateOnly(date).toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = toDateOnly(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addMonthsClamped(date: Date, months: number, preferredDay?: number | null): Date {
  const base = toDateOnly(date);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + months;
  const target = new Date(Date.UTC(year, month, 1));
  const day = preferredDay ?? base.getUTCDate();
  target.setUTCDate(Math.min(day, daysInMonth(target.getUTCFullYear(), target.getUTCMonth())));
  return target;
}

export function addYearsClamped(date: Date, years: number): Date {
  const base = toDateOnly(date);
  const target = new Date(Date.UTC(base.getUTCFullYear() + years, base.getUTCMonth(), 1));
  target.setUTCDate(Math.min(base.getUTCDate(), daysInMonth(target.getUTCFullYear(), target.getUTCMonth())));
  return target;
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round((toDateOnly(end).getTime() - toDateOnly(start).getTime()) / DAY_MS);
}

export function eachDay(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
