import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_DONATION_CATEGORIES } from './donations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOMIZATIONS_FILE = path.join(__dirname, '..', 'data', 'customizations.json');
const LEGACY_PRICES_FILE = path.join(__dirname, '..', 'data', 'prices.json');

const DEFAULT_CATEGORY_IDS = new Set(
  DEFAULT_DONATION_CATEGORIES.map((category) => category.id)
);

/** @type {{
 *   categoryNames: Record<string, string>,
 *   customCategories: Array<{ id: string, name: string, donations: object[] }>,
 *   customDonations: Record<string, object[]>,
 *   priceOverrides: Record<string, number>,
 *   durationOverrides: Record<string, number>,
 *   nameOverrides: Record<string, string>,
 *   deletedDonationIds: string[]
 * }} */
let customizations = loadCustomizations();

/** @type {Set<(categories: ReturnType<typeof getCategories>) => void>} */
const listeners = new Set();

function emptyCustomizations() {
  return {
    categoryNames: {},
    customCategories: [],
    customDonations: {},
    priceOverrides: {},
    durationOverrides: {},
    nameOverrides: {},
    deletedDonationIds: [],
  };
}

function loadCustomizations() {
  try {
    if (fs.existsSync(CUSTOMIZATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOMIZATIONS_FILE, 'utf8'));
      return {
        ...emptyCustomizations(),
        ...data,
        categoryNames: data.categoryNames ?? {},
        customCategories: data.customCategories ?? [],
        customDonations: data.customDonations ?? {},
        priceOverrides: data.priceOverrides ?? {},
        durationOverrides: data.durationOverrides ?? {},
        nameOverrides: data.nameOverrides ?? {},
        deletedDonationIds: data.deletedDonationIds ?? [],
      };
    }
  } catch {
    // fall through to migration/defaults
  }

  const initial = emptyCustomizations();
  if (fs.existsSync(LEGACY_PRICES_FILE)) {
    try {
      initial.priceOverrides = JSON.parse(
        fs.readFileSync(LEGACY_PRICES_FILE, 'utf8')
      );
      saveCustomizations(initial);
    } catch {
      // ignore
    }
  }
  return initial;
}

function saveCustomizations(data = customizations) {
  fs.mkdirSync(path.dirname(CUSTOMIZATIONS_FILE), { recursive: true });
  fs.writeFileSync(CUSTOMIZATIONS_FILE, JSON.stringify(data, null, 2));
}

function notify() {
  const snapshot = getCategories();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function isDonationVisible(donationId) {
  return !customizations.deletedDonationIds.includes(donationId);
}

function clearDonationOverrides(donationId) {
  delete customizations.priceOverrides[donationId];
  delete customizations.durationOverrides[donationId];
  delete customizations.nameOverrides[donationId];
}

function applyDonationOverrides(donation) {
  const price = customizations.priceOverrides[donation.id] ?? donation.price;
  const durationMinutes =
    customizations.durationOverrides[donation.id] ?? donation.durationMinutes;
  const name = customizations.nameOverrides[donation.id] ?? donation.name;
  return normalizeDonation({
    ...donation,
    name,
    price,
    durationMinutes,
  });
}

function normalizeDonation(donation) {
  let durationMinutes = donation.durationMinutes;
  if (durationMinutes === null || durationMinutes === undefined) {
    durationMinutes = donation.hasTimer ? 10 : 0;
  }
  durationMinutes = Number(durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    durationMinutes = 0;
  }
  return {
    ...donation,
    durationMinutes,
    hasTimer: durationMinutes > 0,
  };
}

function resolveCategoryName(categoryId, fallbackName) {
  return customizations.categoryNames[categoryId]?.trim() || fallbackName;
}

function findCategory(categoryId) {
  if (DEFAULT_CATEGORY_IDS.has(categoryId)) {
    const base = DEFAULT_DONATION_CATEGORIES.find(
      (category) => category.id === categoryId
    );
    if (!base) return null;
    return {
      ...base,
      name: resolveCategoryName(categoryId, base.name),
      donations: [
        ...base.donations
          .filter((donation) => isDonationVisible(donation.id))
          .map(applyDonationOverrides),
        ...(customizations.customDonations[categoryId] ?? [])
          .filter((donation) => isDonationVisible(donation.id))
          .map(applyDonationOverrides),
      ],
    };
  }

  const custom = customizations.customCategories.find(
    (category) => category.id === categoryId
  );
  if (!custom) return null;

  return {
    ...custom,
    name: resolveCategoryName(categoryId, custom.name),
    donations: [
      ...(custom.donations ?? [])
        .filter((donation) => isDonationVisible(donation.id))
        .map(applyDonationOverrides),
      ...(customizations.customDonations[categoryId] ?? [])
        .filter((donation) => isDonationVisible(donation.id))
        .map(applyDonationOverrides),
    ],
  };
}

function validateDonationInput(input, { partial = false } = {}) {
  const result = {};

  if (!partial || input.name !== undefined) {
    const name = String(input.name ?? '').trim();
    if (!name) throw new Error('Назва донату обовʼязкова');
    result.name = name;
  }

  if (!partial || input.price !== undefined) {
    const price = Number(input.price);
    if (!Number.isInteger(price) || price <= 0) {
      throw new Error('Ціна має бути цілим числом більше 0');
    }
    result.price = price;
  }

  if (!partial || input.durationMinutes !== undefined || input.hasTimer !== undefined) {
    let duration;
    if (input.durationMinutes !== undefined) {
      if (input.durationMinutes === null || input.durationMinutes === '') {
        duration = 0;
      } else {
        duration = Number(input.durationMinutes);
      }
    } else if (input.hasTimer !== undefined) {
      duration = input.hasTimer ? Number(input.durationMinutes ?? 10) : 0;
    } else {
      duration = 0;
    }

    if (!Number.isInteger(duration) || duration < 0) {
      throw new Error('Тривалість має бути цілим числом від 0');
    }

    result.durationMinutes = duration;
    result.hasTimer = duration > 0;
  }

  if (input.description !== undefined) {
    result.description = String(input.description).trim() || undefined;
  }

  if (input.currency !== undefined) {
    result.currency = String(input.currency).trim() || 'UAH';
  }

  return result;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCategories() {
  const defaultCategories = DEFAULT_DONATION_CATEGORIES.map((category) =>
    findCategory(category.id)
  );

  const customCategories = customizations.customCategories.map((category) =>
    findCategory(category.id)
  );

  return [...defaultCategories, ...customCategories];
}

export function getAllDonations() {
  return getCategories().flatMap((category) =>
    category.donations.map((donation) => ({
      ...donation,
      categoryId: category.id,
      categoryName: category.name,
    }))
  );
}

export function getDonationById(id) {
  return getAllDonations().find((donation) => donation.id === id) ?? null;
}

export function updatePrice(donationId, price) {
  const donation = getDonationById(donationId);
  if (!donation) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  const parsed = Number(price);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Ціна має бути цілим числом більше 0');
  }

  const baseDonation = findBaseDonation(donationId);
  const defaultPrice = baseDonation?.price ?? parsed;

  if (parsed === defaultPrice) {
    delete customizations.priceOverrides[donationId];
  } else {
    customizations.priceOverrides[donationId] = parsed;
  }

  saveCustomizations();
  notify();
  return getDonationById(donationId);
}

function updateCustomDonationField(donationId, field, value) {
  for (const donations of Object.values(customizations.customDonations)) {
    const donation = donations.find((item) => item.id === donationId);
    if (donation) {
      donation[field] = value;
      return true;
    }
  }

  for (const category of customizations.customCategories) {
    const donation = category.donations?.find((item) => item.id === donationId);
    if (donation) {
      donation[field] = value;
      return true;
    }
  }

  return false;
}

export function updateDuration(donationId, durationMinutes) {
  const donation = getDonationById(donationId);
  if (!donation) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  const parsed = Number(durationMinutes);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Тривалість має бути цілим числом від 0');
  }

  const baseDonation = findBaseDonation(donationId);
  const defaultDuration = baseDonation
    ? normalizeDonation(baseDonation).durationMinutes
    : parsed;

  if (updateCustomDonationField(donationId, 'durationMinutes', parsed)) {
    updateCustomDonationField(donationId, 'hasTimer', parsed > 0);
    saveCustomizations();
    notify();
    return getDonationById(donationId);
  }

  if (parsed === defaultDuration) {
    delete customizations.durationOverrides[donationId];
  } else {
    customizations.durationOverrides[donationId] = parsed;
  }

  saveCustomizations();
  notify();
  return getDonationById(donationId);
}

export function updateName(donationId, name) {
  const donation = getDonationById(donationId);
  if (!donation) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new Error('Назва донату обовʼязкова');
  }

  const baseDonation = findBaseDonation(donationId);
  const defaultName = baseDonation?.name ?? trimmed;

  if (updateCustomDonationField(donationId, 'name', trimmed)) {
    saveCustomizations();
    notify();
    return getDonationById(donationId);
  }

  if (trimmed === defaultName) {
    delete customizations.nameOverrides[donationId];
  } else {
    customizations.nameOverrides[donationId] = trimmed;
  }

  saveCustomizations();
  notify();
  return getDonationById(donationId);
}

function findBaseDonation(donationId) {
  for (const category of DEFAULT_DONATION_CATEGORIES) {
    const found = category.donations.find((donation) => donation.id === donationId);
    if (found) return found;
  }

  for (const category of customizations.customCategories) {
    const found = category.donations?.find((donation) => donation.id === donationId);
    if (found) return found;
  }

  for (const donations of Object.values(customizations.customDonations)) {
    const found = donations.find((donation) => donation.id === donationId);
    if (found) return found;
  }

  return null;
}

export function addCategory(name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new Error('Назва категорії обовʼязкова');
  }

  const category = {
    id: `cat-${uuidv4().slice(0, 8)}`,
    name: trimmed,
    donations: [],
  };

  customizations.customCategories.push(category);
  saveCustomizations();
  notify();
  return findCategory(category.id);
}

export function renameCategory(categoryId, name) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new Error('Назва категорії обовʼязкова');
  }

  const exists =
    DEFAULT_CATEGORY_IDS.has(categoryId) ||
    customizations.customCategories.some((category) => category.id === categoryId);

  if (!exists) {
    throw new Error(`Невідома категорія: ${categoryId}`);
  }

  customizations.categoryNames[categoryId] = trimmed;
  saveCustomizations();
  notify();
  return findCategory(categoryId);
}

export function addDonation(categoryId, input) {
  const category = findCategory(categoryId);
  if (!category) {
    throw new Error(`Невідома категорія: ${categoryId}`);
  }

  const validated = validateDonationInput(input);
  const durationMinutes = validated.durationMinutes ?? 0;
  const hasTimer = durationMinutes > 0;

  const donation = {
    id: `don-${uuidv4().slice(0, 8)}`,
    name: validated.name,
    price: validated.price,
    currency: validated.currency ?? 'UAH',
    durationMinutes,
    hasTimer,
    description: validated.description,
    isCustom: true,
  };

  if (DEFAULT_CATEGORY_IDS.has(categoryId)) {
    if (!customizations.customDonations[categoryId]) {
      customizations.customDonations[categoryId] = [];
    }
    customizations.customDonations[categoryId].push(donation);
  } else {
    const customCategory = customizations.customCategories.find(
      (item) => item.id === categoryId
    );
    if (!customCategory) {
      throw new Error(`Невідома категорія: ${categoryId}`);
    }
    customCategory.donations.push(donation);
  }

  saveCustomizations();
  notify();
  return {
    ...donation,
    categoryId,
    categoryName: category.name,
  };
}

function removeCustomDonation(donationId) {
  for (const [categoryId, donations] of Object.entries(
    customizations.customDonations
  )) {
    const index = donations.findIndex((item) => item.id === donationId);
    if (index !== -1) {
      donations.splice(index, 1);
      if (donations.length === 0) {
        delete customizations.customDonations[categoryId];
      }
      return true;
    }
  }

  for (const category of customizations.customCategories) {
    const donations = category.donations;
    if (!donations) continue;
    const index = donations.findIndex((item) => item.id === donationId);
    if (index !== -1) {
      donations.splice(index, 1);
      return true;
    }
  }

  return false;
}

export function deleteDonation(donationId) {
  const donation = getDonationById(donationId);
  if (!donation) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  if (removeCustomDonation(donationId)) {
    clearDonationOverrides(donationId);
    saveCustomizations();
    notify();
    return { ok: true };
  }

  if (!findBaseDonation(donationId)) {
    throw new Error(`Невідомий донат: ${donationId}`);
  }

  if (!customizations.deletedDonationIds.includes(donationId)) {
    customizations.deletedDonationIds.push(donationId);
  }
  clearDonationOverrides(donationId);
  saveCustomizations();
  notify();
  return { ok: true };
}

export function deleteCategory(categoryId) {
  if (DEFAULT_CATEGORY_IDS.has(categoryId)) {
    throw new Error('Неможливо видалити стандартну категорію');
  }

  const index = customizations.customCategories.findIndex(
    (category) => category.id === categoryId
  );
  if (index === -1) {
    throw new Error(`Невідома категорія: ${categoryId}`);
  }

  const category = customizations.customCategories[index];
  for (const donation of category.donations ?? []) {
    clearDonationOverrides(donation.id);
  }
  for (const donation of customizations.customDonations[categoryId] ?? []) {
    clearDonationOverrides(donation.id);
  }

  customizations.customCategories.splice(index, 1);
  delete customizations.customDonations[categoryId];
  delete customizations.categoryNames[categoryId];

  saveCustomizations();
  notify();
  return { ok: true };
}
