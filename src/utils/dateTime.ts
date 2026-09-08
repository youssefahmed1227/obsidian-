export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayName = (typeof DAYS_OF_WEEK)[number];

/**
 * Safely parses any date input into a valid Date object, defaulting to current time if invalid.
 */
export function safeDate(input?: string | number | Date | null): Date {
  if (!input) return new Date();
  const d = new Date(input);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Returns the full name of the day (e.g. "Monday", "Tuesday")
 */
export function getDayName(input?: string | number | Date | null): DayName {
  const d = safeDate(input);
  return DAYS_OF_WEEK[d.getDay()];
}

/**
 * Returns the short name of the day (e.g. "Mon", "Tue")
 */
export function getShortDayName(input?: string | number | Date | null): string {
  const d = safeDate(input);
  return DAYS_OF_WEEK[d.getDay()].slice(0, 3);
}

/**
 * Formats date as "Sep 7, 2026" or "September 7, 2026"
 */
export function formatDateOnly(input?: string | number | Date | null, fullMonth = false): string {
  const d = safeDate(input);
  return d.toLocaleDateString('en-US', {
    month: fullMonth ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats time as "05:44 PM"
 */
export function formatTimeOnly(input?: string | number | Date | null): string {
  const d = safeDate(input);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats date with day name: "Monday, Sep 7, 2026"
 */
export function formatDateWithDay(input?: string | number | Date | null): string {
  const d = safeDate(input);
  const day = getDayName(d);
  const dateStr = formatDateOnly(d);
  return `${day}, ${dateStr}`;
}

/**
 * Formats complete history timestamp: "Monday, Sep 7, 2026 • 05:44 PM"
 */
export function formatFullDateTime(input?: string | number | Date | null): string {
  const d = safeDate(input);
  const day = getDayName(d);
  const dateStr = formatDateOnly(d);
  const timeStr = formatTimeOnly(d);
  return `${day}, ${dateStr} • ${timeStr}`;
}

/**
 * Returns a complete history breakdown object
 */
export interface HistoryTimeBreakdown {
  timestamp: string; // ISO string
  dayName: DayName;
  shortDay: string;
  date: string;
  time: string;
  fullFormatted: string;
}

export function getHistoryTimeBreakdown(input?: string | number | Date | null): HistoryTimeBreakdown {
  const d = safeDate(input);
  const dayName = getDayName(d);
  const shortDay = dayName.slice(0, 3);
  const date = formatDateOnly(d);
  const time = formatTimeOnly(d);
  const fullFormatted = `${dayName}, ${date} • ${time}`;

  return {
    timestamp: d.toISOString(),
    dayName,
    shortDay,
    date,
    time,
    fullFormatted,
  };
}
