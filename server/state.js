import { v4 as uuidv4 } from 'uuid';
import { getDonationById } from './catalog.js';
import { pickRandomDebuff } from './random.js';

/** @type {import('./types.js').ActiveDebuff[]} */
let activeDebuffs = [];

/** @type {Set<(state: import('./types.js').ActiveDebuff[]) => void>} */
const listeners = new Set();

/** @type {Set<(expired: import('./types.js').ActiveDebuff[]) => void>} */
const expiredListeners = new Set();

let expiryTimer = null;

function notify() {
  const snapshot = getActiveDebuffs();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function notifyExpired(expired) {
  if (expired.length === 0) return;
  const snapshot = expired.map((item) => ({ ...item }));
  for (const listener of expiredListeners) {
    listener(snapshot);
  }
}

function scheduleExpiryCheck() {
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }

  const now = Date.now();
  const nextExpiry = activeDebuffs
    .filter((d) => d.expiresAt !== null)
    .map((d) => d.expiresAt)
    .filter((t) => t > now)
    .sort((a, b) => a - b)[0];

  if (nextExpiry) {
    expiryTimer = setTimeout(() => {
      removeExpired();
      scheduleExpiryCheck();
    }, nextExpiry - now + 50);
  }
}

function removeExpired() {
  const now = Date.now();
  const expired = activeDebuffs.filter(
    (d) => d.expiresAt !== null && d.expiresAt <= now
  );
  activeDebuffs = activeDebuffs.filter(
    (d) => d.expiresAt === null || d.expiresAt > now
  );
  if (expired.length > 0) {
    notifyExpired(expired);
    notify();
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeExpired(listener) {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

export function getActiveDebuffs() {
  removeExpired();
  return activeDebuffs.map((d) => ({ ...d }));
}

export function activateDebuff(donationId, donorName = '') {
  const donation = getDonationById(donationId);
  if (!donation) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  let effective = donation;
  let isRandomResult = false;

  if (donation.isRandom) {
    const picked = pickRandomDebuff(donation);
    if (!picked) {
      throw new Error('Немає доступних дебафів для випадкового вибору');
    }
    effective = picked;
    isRandomResult = true;
  }

  const durationMinutes = effective.durationMinutes ?? 0;
  const hasTimer = durationMinutes > 0;

  const now = Date.now();
  const expiresAt = hasTimer ? now + durationMinutes * 60 * 1000 : null;

  const debuff = {
    id: uuidv4(),
    donationId: donation.id,
    name: effective.name,
    categoryId: effective.categoryId,
    categoryName: isRandomResult ? 'Випадковий дебаф' : effective.categoryName,
    price: donation.price,
    currency: donation.currency,
    donorName: donorName.trim(),
    startedAt: now,
    expiresAt,
    hasTimer,
    isRandomResult,
    pickedDebuffId: isRandomResult ? effective.id : null,
  };

  activeDebuffs.push(debuff);
  notify();
  scheduleExpiryCheck();
  return debuff;
}

export function deactivateDebuff(activeId) {
  const before = activeDebuffs.length;
  activeDebuffs = activeDebuffs.filter((d) => d.id !== activeId);
  if (activeDebuffs.length !== before) {
    notify();
    scheduleExpiryCheck();
    return true;
  }
  return false;
}

export function clearAllDebuffs() {
  if (activeDebuffs.length === 0) return;
  activeDebuffs = [];
  notify();
  scheduleExpiryCheck();
}
