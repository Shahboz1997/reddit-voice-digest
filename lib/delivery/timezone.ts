const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function normalizeTimezone(timezone: string | null | undefined) {
  const value = timezone?.trim() || "UTC";

  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

export function localTimeHHMM(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function localWeekdayIndex(date: Date, timeZone: string) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  return WEEKDAY_SHORT[label] ?? date.getUTCDay();
}

export function localDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function minutesSinceMidnight(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map((part) => Number(part));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

/** True when local clock is within `windowMinutes` of the user's delivery time. */
export function isDeliveryDueNow(
  deliveryLocalTime: string,
  now: Date,
  timeZone: string,
  windowMinutes = 8,
) {
  const target = minutesSinceMidnight(deliveryLocalTime.slice(0, 5));
  const current = minutesSinceMidnight(localTimeHHMM(now, timeZone));

  if (target === null || current === null) {
    return false;
  }

  const delta = Math.abs(current - target);
  return delta <= windowMinutes || delta >= 24 * 60 - windowMinutes;
}

export function isWeekdayInTimezone(date: Date, timeZone: string) {
  const day = localWeekdayIndex(date, timeZone);
  return day >= 1 && day <= 5;
}
