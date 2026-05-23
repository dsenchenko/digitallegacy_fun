import { DONATION_URL } from '../config';

/**
 * Builds a Donatello donation URL with prefilled amount and message.
 * Donatello query params: a = amount (UAH), m = message (max 500 chars)
 * @see https://donatello.to/user/user.js
 */
export function buildDonatelloUrl(donation) {
  const url = new URL(DONATION_URL);
  url.searchParams.set('a', String(donation.price));
  url.searchParams.set('m', donation.name.slice(0, 500));
  return url.toString();
}
