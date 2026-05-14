const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const longMonthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function formatShortMonthDay(value: string) {
  return shortMonthDayFormatter.format(new Date(value));
}

export function formatLongMonthDay(value: string) {
  return longMonthDayFormatter.format(new Date(value));
}

export function formatWeekday(value: string) {
  return weekdayFormatter.format(new Date(value));
}

export function formatFullDate(value: string) {
  return fullDateFormatter.format(new Date(value));
}
const DIGEST_DATE_LOCALE = "en-US";
const DIGEST_DATE_TIME_ZONE = "UTC";

export function formatDigestDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(DIGEST_DATE_LOCALE, {
    timeZone: DIGEST_DATE_TIME_ZONE,
    ...options,
  }).format(new Date(value));
}
