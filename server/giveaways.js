import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'giveaways.json');
export const GIVEAWAY_IMAGES_DIR = path.join(
  __dirname,
  '..',
  'data',
  'giveaway-images'
);

/** @type {{ giveaways: object[], participants: object[] }} */
let store = loadStore();

/** @type {Set<(data: ReturnType<typeof getPublicGiveaways>) => void>} */
const listeners = new Set();

function emptyStore() {
  return { giveaways: [], participants: [] };
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return {
        giveaways: data.giveaways ?? [],
        participants: data.participants ?? [],
      };
    }
  } catch {
    // ignore
  }
  return emptyStore();
}

function saveStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function notify() {
  const snapshot = getPublicGiveaways();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function findGiveaway(id) {
  return store.giveaways.find((item) => item.id === id) ?? null;
}

function participantsFor(giveawayId) {
  return store.participants.filter((item) => item.giveawayId === giveawayId);
}

function ticketsFromDonation(donatedAmountUah, ticketPriceUah) {
  const amount = Number(donatedAmountUah);
  const price = Number(ticketPriceUah);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Сума донату має бути більше 0');
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Невірна ціна квитка');
  }
  const tickets = Math.floor(amount / price);
  if (tickets <= 0) {
    throw new Error(`Мінімальна сума для участі: ${price} UAH`);
  }
  return tickets;
}

function publicGiveawayView(giveaway) {
  const participants = participantsFor(giveaway.id);
  const totalTickets = participants.reduce((sum, p) => sum + p.ticketCount, 0);
  const winner =
    giveaway.winnerParticipantId &&
    store.participants.find((p) => p.id === giveaway.winnerParticipantId);

  return {
    id: giveaway.id,
    title: giveaway.title,
    description: giveaway.description,
    imageUrl: giveaway.imageFilename
      ? `/api/giveaways/images/${giveaway.imageFilename}`
      : null,
    ticketPriceUah: giveaway.ticketPriceUah,
    status: giveaway.status,
    participantCount: participants.length,
    totalTickets,
    winner: winner ? { id: winner.id, name: winner.name } : null,
    drawnAt: giveaway.drawnAt ?? null,
    showOnWidget: Boolean(giveaway.showOnWidget),
    createdAt: giveaway.createdAt,
  };
}

export function getPublicGiveaways() {
  return store.giveaways
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(publicGiveawayView);
}

export function getGiveawayAdmin(id) {
  const giveaway = findGiveaway(id);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${id}`);
  }
  const participants = participantsFor(id)
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((p) => ({ ...p }));

  return {
    ...publicGiveawayView(giveaway),
    participants,
  };
}

export function createGiveaway({ title, description, ticketPriceUah, imageFilename }) {
  const trimmedTitle = String(title ?? '').trim();
  if (!trimmedTitle) {
    throw new Error('Назва розіграшу обовʼязкова');
  }

  const price = Number(ticketPriceUah);
  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('Ціна квитка має бути цілим числом більше 0');
  }

  const giveaway = {
    id: `give-${uuidv4().slice(0, 8)}`,
    title: trimmedTitle,
    description: String(description ?? '').trim(),
    imageFilename: imageFilename ?? null,
    ticketPriceUah: price,
    status: 'open',
    winnerParticipantId: null,
    showOnWidget: false,
    createdAt: Date.now(),
    drawnAt: null,
  };

  store.giveaways.push(giveaway);
  saveStore();
  notify();
  return getGiveawayAdmin(giveaway.id);
}

export function updateGiveaway(id, { title, description, ticketPriceUah, status }) {
  const giveaway = findGiveaway(id);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${id}`);
  }
  if (giveaway.status === 'drawn') {
    throw new Error('Неможливо редагувати завершений розіграш');
  }

  if (title !== undefined) {
    const trimmed = String(title).trim();
    if (!trimmed) throw new Error('Назва розіграшу обовʼязкова');
    giveaway.title = trimmed;
  }
  if (description !== undefined) {
    giveaway.description = String(description).trim();
  }
  if (ticketPriceUah !== undefined) {
    const price = Number(ticketPriceUah);
    if (!Number.isInteger(price) || price <= 0) {
      throw new Error('Ціна квитка має бути цілим числом більше 0');
    }
    giveaway.ticketPriceUah = price;
  }
  if (status !== undefined) {
    if (!['open', 'closed'].includes(status)) {
      throw new Error('Статус має бути open або closed');
    }
    giveaway.status = status;
  }

  saveStore();
  notify();
  return getGiveawayAdmin(id);
}

export function deleteGiveaway(id) {
  const index = store.giveaways.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Невідомий розіграш: ${id}`);
  }

  const [removed] = store.giveaways.splice(index, 1);
  store.participants = store.participants.filter((p) => p.giveawayId !== id);

  if (removed.imageFilename) {
    const imagePath = path.join(GIVEAWAY_IMAGES_DIR, removed.imageFilename);
    try {
      fs.unlinkSync(imagePath);
    } catch {
      // ignore
    }
  }

  saveStore();
  notify();
  return { ok: true };
}

export function addParticipant(giveawayId, { name, donatedAmountUah, ticketCount }) {
  const giveaway = findGiveaway(giveawayId);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${giveawayId}`);
  }
  if (giveaway.status === 'drawn') {
    throw new Error('Розіграш уже завершено');
  }

  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    throw new Error("Ім'я учасника обовʼязкове");
  }

  let tickets;
  let donated = null;

  if (ticketCount !== undefined && ticketCount !== null && ticketCount !== '') {
    tickets = Number(ticketCount);
    if (!Number.isInteger(tickets) || tickets <= 0) {
      throw new Error('Кількість квитків має бути цілим числом більше 0');
    }
    donated =
      donatedAmountUah !== undefined && donatedAmountUah !== ''
        ? Number(donatedAmountUah)
        : tickets * giveaway.ticketPriceUah;
  } else {
    donated = Number(donatedAmountUah);
    tickets = ticketsFromDonation(donated, giveaway.ticketPriceUah);
  }

  const participant = {
    id: `gp-${uuidv4().slice(0, 8)}`,
    giveawayId,
    name: trimmedName,
    ticketCount: tickets,
    donatedAmountUah: donated,
    addedAt: Date.now(),
  };

  store.participants.push(participant);
  saveStore();
  notify();
  return participant;
}

export function updateParticipant(giveawayId, participantId, fields) {
  const giveaway = findGiveaway(giveawayId);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${giveawayId}`);
  }
  if (giveaway.status === 'drawn') {
    throw new Error('Розіграш уже завершено');
  }

  const participant = store.participants.find(
    (p) => p.id === participantId && p.giveawayId === giveawayId
  );
  if (!participant) {
    throw new Error('Учасника не знайдено');
  }

  if (fields.name !== undefined) {
    const trimmed = String(fields.name).trim();
    if (!trimmed) throw new Error("Ім'я учасника обовʼязкове");
    participant.name = trimmed;
  }

  if (fields.donatedAmountUah !== undefined) {
    participant.donatedAmountUah = Number(fields.donatedAmountUah);
    participant.ticketCount = ticketsFromDonation(
      participant.donatedAmountUah,
      giveaway.ticketPriceUah
    );
  } else if (fields.ticketCount !== undefined) {
    const tickets = Number(fields.ticketCount);
    if (!Number.isInteger(tickets) || tickets <= 0) {
      throw new Error('Кількість квитків має бути цілим числом більше 0');
    }
    participant.ticketCount = tickets;
  }

  saveStore();
  notify();
  return participant;
}

export function removeParticipant(giveawayId, participantId) {
  const giveaway = findGiveaway(giveawayId);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${giveawayId}`);
  }
  if (giveaway.status === 'drawn') {
    throw new Error('Розіграш уже завершено');
  }

  const before = store.participants.length;
  store.participants = store.participants.filter(
    (p) => !(p.id === participantId && p.giveawayId === giveawayId)
  );
  if (store.participants.length === before) {
    throw new Error('Учасника не знайдено');
  }

  saveStore();
  notify();
  return { ok: true };
}

function pickWeightedWinner(participants) {
  const totalTickets = participants.reduce((sum, p) => sum + p.ticketCount, 0);
  if (totalTickets === 0) return null;

  let roll = Math.floor(Math.random() * totalTickets);
  for (const participant of participants) {
    roll -= participant.ticketCount;
    if (roll < 0) return participant;
  }
  return participants[participants.length - 1];
}

export function drawWinner(giveawayId) {
  const giveaway = findGiveaway(giveawayId);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${giveawayId}`);
  }
  if (giveaway.status === 'drawn') {
    throw new Error('Переможця вже обрано');
  }

  const participants = participantsFor(giveawayId);
  if (participants.length === 0) {
    throw new Error('Немає учасників для розіграшу');
  }

  const winner = pickWeightedWinner(participants);
  if (!winner) {
    throw new Error('Немає квитків для розіграшу');
  }

  giveaway.status = 'drawn';
  giveaway.winnerParticipantId = winner.id;
  giveaway.drawnAt = Date.now();
  giveaway.showOnWidget = true;

  saveStore();
  notify();
  return getGiveawayAdmin(giveawayId);
}

export function setGiveawayWidgetDisplay(giveawayId, visible) {
  const giveaway = findGiveaway(giveawayId);
  if (!giveaway) {
    throw new Error(`Невідомий розіграш: ${giveawayId}`);
  }
  if (giveaway.status !== 'drawn') {
    throw new Error('Показувати на віджеті можна лише завершений розіграш');
  }

  giveaway.showOnWidget = Boolean(visible);
  saveStore();
  notify();
  return getGiveawayAdmin(giveawayId);
}

export function resolveImagePath(filename) {
  const safe = path.basename(String(filename));
  const full = path.join(GIVEAWAY_IMAGES_DIR, safe);
  if (!full.startsWith(GIVEAWAY_IMAGES_DIR)) {
    throw new Error('Невірний шлях до файлу');
  }
  if (!fs.existsSync(full)) {
    throw new Error('Зображення не знайдено');
  }
  return full;
}
