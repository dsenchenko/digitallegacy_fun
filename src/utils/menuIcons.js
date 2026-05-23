const DONATION_ICONS = {
  'random-debuff': '🎲',
  'disable-map-hints': '🗺️',
  'no-healing': '🚫',
  'invert-controls': '🔄',
  'starter-weapon-only': '🔫',
  'no-running': '🐢',
  'no-dodge-block-roll': '🧱',
  'blind-play': '🙈',
  'song-request': '🎧',
  'guitar-streamer-choice': '🎸',
  'guitar-donor-choice': '🎸',
  'watch-video-together': '📺',
  'english-only': '🇬🇧',
  'discord-with-donor': '🎙️',
  'unfiltered-dev-story': '📖',
  'watch-anime': '🍿',
  'live-script-writing': '✍️',
  'request-next-game': '🎯',
  'change-game-now': '🔀',
  'restart-game-hard': '💀',
  'hogwarts-marathon': '🧙',
  'chat-game-jam': '🛠️',
};

const CATEGORY_ICONS = {
  'game-debuffs': '🎮',
  music: '🎵',
  interaction: '💬',
  'major-requests': '⭐',
};

const CATEGORY_ACCENTS = {
  'game-debuffs': 'red',
  music: 'green',
  interaction: 'blue',
  'major-requests': 'purple',
  custom: 'teal',
};

export function getCategoryIcon(categoryId) {
  if (categoryId.startsWith('cat-')) return '✨';
  return CATEGORY_ICONS[categoryId] ?? '🎁';
}

export function getCategoryAccent(categoryId) {
  if (categoryId.startsWith('cat-')) return CATEGORY_ACCENTS.custom;
  return CATEGORY_ACCENTS[categoryId] ?? 'teal';
}

export function getDonationIcon(donation, categoryId) {
  if (donation.isRandom) return '🎲';
  if (DONATION_ICONS[donation.id]) return DONATION_ICONS[donation.id];
  if (donation.isCustom) return '✨';
  if (donation.hasTimer) return '⏱️';
  return getCategoryIcon(categoryId);
}

export const MENU_HEADER_ICON = '🎁';
export const DONATE_BTN_ICON = '💛';
