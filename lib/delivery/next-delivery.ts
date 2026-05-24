import {
  isWeekdayInTimezone,
  localDateKey,
  localTimeHHMM,
  normalizeTimezone,
} from "@/lib/delivery/timezone";

function minutesSinceMidnight(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map((part) => Number(part));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

/**
 * Human-readable label for the next scheduled delivery window.
 */
export function describeNextDelivery(input: {
  deliveryLocalTime: string;
  timeZone: string;
  weekdaysOnly: boolean;
  now?: Date;
  lastCompletedRunDate?: string | null;
}) {
  const now = input.now ?? new Date();
  const timeZone = normalizeTimezone(input.timeZone);
  const slot = input.deliveryLocalTime.slice(0, 5);
  const targetMinutes = minutesSinceMidnight(slot);

  if (targetMinutes === null) {
    return null;
  }

  const todayKey = localDateKey(now, timeZone);

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const probe = new Date(now.getTime() + dayOffset * 86_400_000);

    if (input.weekdaysOnly && !isWeekdayInTimezone(probe, timeZone)) {
      continue;
    }

    if (dayOffset === 0) {
      const currentMinutes = minutesSinceMidnight(localTimeHHMM(now, timeZone));
      const passedWindow =
        currentMinutes !== null && currentMinutes > targetMinutes + 8;
      const alreadyCompletedToday =
        input.lastCompletedRunDate === todayKey && passedWindow;

      if (passedWindow || alreadyCompletedToday) {
        continue;
      }

      return `Today at ${slot} (${timeZone})`;
    }

    if (dayOffset === 1) {
      return `Tomorrow at ${slot} (${timeZone})`;
    }

    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(probe);

    return `${weekday} at ${slot} (${timeZone})`;
  }

  return `Next slot at ${slot} (${timeZone})`;
}
