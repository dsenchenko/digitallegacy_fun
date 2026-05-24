export const DONATION_SLUG = 'digitallegacyua';
export const DONATION_GOAL = 'spetsuri-na-remont-korcha';

/** Public Donatello page (direct). Prefer DONATION_PROXY_PATH for menu links. */
export const DONATION_URL = `https://donatello.to/${DONATION_SLUG}?g=${DONATION_GOAL}`;

/** Same-origin proxy path — prefills amount/message but keeps inputs editable. */
export const DONATION_PROXY_PATH = `/${DONATION_SLUG}`;
