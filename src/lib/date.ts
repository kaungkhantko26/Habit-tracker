const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatDateKey(date: Date) {
  const next = startOfDay(date);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

export function subtractDays(date: Date, count: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - count);
  return next;
}

export function getRecentDateKeys(days: number) {
  return Array.from({ length: days }, (_, index) =>
    formatDateKey(subtractDays(new Date(), days - index - 1)),
  );
}

export function dayLabel(dateKey: string) {
  return weekdayFormatter.format(parseDateKey(dateKey));
}

export function shortDateLabel(dateKey: string) {
  return formatter.format(parseDateKey(dateKey));
}

export function dayNumber(dateKey: string) {
  return parseDateKey(dateKey).getDay();
}
