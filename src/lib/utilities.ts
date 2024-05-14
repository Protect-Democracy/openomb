/**
 * General utilities that should run fine on server or client.
 */

import { toDate, toZonedTime } from 'date-fns-tz';
import { add as dateAdd } from 'date-fns';
import env from '$lib/environment';
import { collectionHour, collectionMinute, collectionTimezone } from '$config';

/**
 * Determine if production using environment or vite
 *
 * @returns True if in production
 */
export const isProduction = (): boolean => env.environment == 'production' || import.meta.env.PROD;

/**
 * Get seconds to the next specific time in a timezone.
 *
 * For example, how many seconds from 11:30pm to 12:30pm (1hr)
 * or from 5:20pm to 3:40am (9hrs 20minutes)
 *
 * @param hour Hour in 24 format of the day
 * @param minute Minute of the hour
 * @param timezone Timezone to convert to
 */
export const secondsToZonedTime = function (
  hour: number,
  minute: number,
  timezone: string,
  dateToCompare: string | Date = new Date(),
  minimumSeconds: number = 30
): number {
  // We want to get the date time in the timezone.  Unsure why this is difficult
  // in date-fns, but this seems to work.
  const parsedDateToCompare = toDate(dateToCompare, { timeZone: timezone });
  const zonedDateToCompare = toZonedTime(parsedDateToCompare, timezone);
  const currentHour = zonedDateToCompare.getHours();
  const currentMinute = zonedDateToCompare.getMinutes();

  // Convert to seconds
  const currentSeconds = currentHour * 60 * 60 + currentMinute * 60;
  const targetSeconds = hour * 60 * 60 + minute * 60;

  let diffSeconds = 0;
  if (currentSeconds > targetSeconds) {
    diffSeconds = 24 * 60 * 60 - currentSeconds + targetSeconds;
  }
  else {
    diffSeconds = targetSeconds - currentSeconds;
  }

  return Math.max(diffSeconds, minimumSeconds);
};

/**
 * Check if prefers reduced motion.  Might not run in browser.
 *
 * TODO: Ideally this is a store that changes if the preference changes.
 */
export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)')?.matches;

/**
 * Get the hours and minutes for cache invalidation
 */
export function hoursAndMinutesForCacheInvalidation() {
  return {
    hour: collectionHour + 3,
    minute: collectionMinute
  };
}

/**
 * Calculates how many seconds to when we expect new data to
 * be in the system
 */
export function secondsToCacheInvalidation() {
  const { hour, minute } = hoursAndMinutesForCacheInvalidation();
  return secondsToZonedTime(hour, minute, collectionTimezone);
}

/**
 * Output date for cache
 */
export function dateForCacheInvalidation() {
  return dateAdd(new Date(), { seconds: secondsToCacheInvalidation() });
}
