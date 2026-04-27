// Design Ref: §8.3 Automation Rules — 4근무시간 SLA 계산
// Plan SC: SC-2 (접수 SLA 4근무시간 자동 접수)

import { addHours, isWeekend, setHours, setMinutes, setSeconds, isAfter, isBefore, addDays } from 'date-fns';

export interface BusinessHours {
  start: number; // 09 (9AM)
  end: number;   // 18 (6PM)
}

const DEFAULT_BUSINESS_HOURS: BusinessHours = { start: 9, end: 18 };

/**
 * Check if a given time is within business hours (excluding weekends).
 */
export function isBusinessTime(
  date: Date,
  holidays: Date[] = [],
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS
): boolean {
  if (isWeekend(date)) return false;

  const isHoliday = holidays.some(
    (h) => h.toDateString() === date.toDateString()
  );
  if (isHoliday) return false;

  const hour = date.getHours();
  return hour >= hours.start && hour < hours.end;
}

/**
 * Calculate the deadline after N business hours from a start time.
 * E.g., 4 business hours from 16:00 on Friday = 11:00 on Monday.
 */
export function addBusinessHours(
  startDate: Date,
  businessHours: number,
  holidays: Date[] = [],
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS
): Date {
  const hoursPerDay = hours.end - hours.start;
  let remainingHours = businessHours;
  let current = new Date(startDate);

  // If starting outside business hours, move to next business start
  if (!isBusinessTime(current, holidays, hours)) {
    current = getNextBusinessStart(current, holidays, hours);
  }

  while (remainingHours > 0) {
    const currentHour = current.getHours();
    const hoursLeftToday = hours.end - currentHour;

    if (remainingHours <= hoursLeftToday) {
      current = addHours(current, remainingHours);
      remainingHours = 0;
    } else {
      remainingHours -= hoursLeftToday;
      current = addDays(current, 1);
      current = getNextBusinessStart(current, holidays, hours);
    }
  }

  return current;
}

/**
 * Get the next business day start time from the given date.
 */
function getNextBusinessStart(
  date: Date,
  holidays: Date[] = [],
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS
): Date {
  let current = setSeconds(setMinutes(setHours(date, hours.start), 0), 0);

  // If we're already past the start but still in business hours, return as-is
  if (
    date.getHours() >= hours.start &&
    date.getHours() < hours.end &&
    !isWeekend(date) &&
    !holidays.some((h) => h.toDateString() === date.toDateString())
  ) {
    return date;
  }

  // Move to next business day
  while (
    isWeekend(current) ||
    holidays.some((h) => h.toDateString() === current.toDateString())
  ) {
    current = addDays(current, 1);
    current = setSeconds(setMinutes(setHours(current, hours.start), 0), 0);
  }

  return current;
}

/**
 * Calculate elapsed business hours between two dates.
 */
export function getBusinessHoursElapsed(
  startDate: Date,
  endDate: Date,
  holidays: Date[] = [],
  hours: BusinessHours = DEFAULT_BUSINESS_HOURS
): number {
  if (isAfter(startDate, endDate)) return 0;

  const hoursPerDay = hours.end - hours.start;
  let elapsed = 0;
  let current = new Date(startDate);

  while (isBefore(current, endDate)) {
    if (isBusinessTime(current, holidays, hours)) {
      elapsed += 1;
    }
    current = addHours(current, 1);
  }

  return elapsed;
}

/**
 * Check if the acceptance SLA deadline has passed.
 */
export function isAcceptanceSLAExpired(
  registeredAt: Date,
  acceptanceHours: number = 4,
  holidays: Date[] = []
): boolean {
  const deadline = addBusinessHours(registeredAt, acceptanceHours, holidays);
  return new Date() > deadline;
}

/**
 * Get the SLA deadline for display.
 */
export function getAcceptanceSLADeadline(
  registeredAt: Date,
  acceptanceHours: number = 4,
  holidays: Date[] = []
): Date {
  return addBusinessHours(registeredAt, acceptanceHours, holidays);
}
