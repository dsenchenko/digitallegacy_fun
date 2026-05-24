import { DONATION_GOAL, DONATION_PROXY_PATH } from '../config';

/**
 * Builds a donation URL with prefilled amount and message.
 * Uses our /digitallegacyua proxy so Donatello prefill params (a, m)
 * do not lock the inputs — see server/donateProxy.js.
 */
export function buildDonatelloUrl(donation) {
  const params = new URLSearchParams({
    g: DONATION_GOAL,
    a: String(donation.price),
    m: donation.name.slice(0, 500),
  });
  return `${DONATION_PROXY_PATH}?${params}`;
}

export function buildGiveawayDonateUrl(giveaway) {
  const params = new URLSearchParams({
    g: DONATION_GOAL,
    a: String(giveaway.ticketPriceUah),
    m: `Розіграш: ${giveaway.title}`.slice(0, 500),
  });
  return `${DONATION_PROXY_PATH}?${params}`;
}
