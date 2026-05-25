export const DONATION_SLUG = 'digitallegacyua';
export const DONATION_GOAL = 'spetsuri-na-remont-korcha';

/** Public Donatello page (direct). Prefer DONATION_PROXY_PATH for menu links. */
export const DONATION_URL = `https://donatello.to/${DONATION_SLUG}?g=${DONATION_GOAL}`;

/** Same-origin proxy path — prefills amount/message but keeps inputs editable. */
export const DONATION_PROXY_PATH = `/${DONATION_SLUG}`;

/** Personal Instagram (homepage); channel account is in SOCIAL_LINKS. */
export const PERSONAL_INSTAGRAM_URL = 'https://www.instagram.com/mitchseven/';

export const SOCIAL_LINKS = [
  {
    id: 'twitch',
    label: 'Twitch',
    href: 'https://www.twitch.tv/digital_legacy_ua',
    iconSrc: '/social/twitch.png',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://youtube.com/@digitallegacyofficial',
    iconSrc: '/social/youtube.png',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/digital.legacy.official',
    iconSrc: '/social/instagram.png',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com/@digital_legacy',
    iconSrc: '/social/tiktok.png',
  },
];
