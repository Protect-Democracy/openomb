/**
 * General utilities that should run fine on server or client.
 */

import { DateTime } from 'luxon';
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
  // Support ISO string or native date and force to specific timezone
  const parsedDateToCompare =
    typeof dateToCompare === 'string'
      ? DateTime.fromISO(dateToCompare)
      : DateTime.fromJSDate(dateToCompare);

  if (!parsedDateToCompare.isValid) {
    return minimumSeconds;
  }

  const zonedDateToCompare = parsedDateToCompare.setZone(timezone).toJSDate();
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
 * Client-side set cookie method with options
 */
export function setCookie(
  name: string,
  value: string,
  options: Record<string, Date | string> = {}
) {
  // If not client side
  if (typeof document === 'undefined') {
    return;
  }

  // Default options
  options = {
    path: '/',
    ...options,
    expires: options.expires instanceof Date ? options.expires.toUTCString() : options.expires
  };

  // Value
  let updatedCookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);

  // Options
  for (const [key, value] of Object.entries(options)) {
    updatedCookie = value ? `${updatedCookie}; ${key}=${value}` : updatedCookie;
  }

  document.cookie = updatedCookie;
}

/**
 * Make a value into a Promise or just pass through if Promise
 */
export function makePromise<T>(value: T | Promise<T>): Promise<T> {
  return value instanceof Promise
    ? value
    : new Promise((resolve) => {
        resolve(value);
      });
}

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
  return DateTime.now().plus({ seconds: secondsToCacheInvalidation() }).toJSDate();
}
