import { getAllDonations } from './catalog.js';

export function getRandomDebuffPool(randomDonation) {
  const categoryId = randomDonation.randomPoolCategory ?? 'game-debuffs';
  return getAllDonations().filter(
    (d) =>
      d.categoryId === categoryId &&
      !d.isRandom &&
      d.durationMinutes > 0
  );
}

export function pickRandomDebuff(randomDonation) {
  const pool = getRandomDebuffPool(randomDonation);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
