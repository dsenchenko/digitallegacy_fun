import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');
const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** @type {Map<string, number>} */
const sessions = new Map();

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      if (data && typeof data === 'object') return data;
    }
  } catch {
    // ignore corrupt file
  }
  return {};
}

function writeSettings(data) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyStoredPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function isAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD || readSettings().adminPasswordHash);
}

function verifyPassword(password) {
  const trimmed = String(password ?? '');
  if (!trimmed) return false;

  if (process.env.ADMIN_PASSWORD) {
    return trimmed === process.env.ADMIN_PASSWORD;
  }

  const stored = readSettings().adminPasswordHash;
  if (!stored) return false;
  return verifyStoredPassword(trimmed, stored);
}

export function setAdminPassword(password) {
  const trimmed = String(password ?? '').trim();
  if (trimmed.length < 4) {
    throw new Error('Пароль має містити щонайменше 4 символи');
  }
  if (process.env.ADMIN_PASSWORD) {
    throw new Error('Пароль задано через ADMIN_PASSWORD у середовищі');
  }

  const settings = readSettings();
  settings.adminPasswordHash = hashPassword(trimmed);
  writeSettings(settings);
}

export function createSession() {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

export function validateSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export function login(password) {
  if (!isAuthConfigured()) {
    throw new Error('Пароль адміністратора ще не налаштовано');
  }
  if (!verifyPassword(password)) {
    throw new Error('Невірний пароль');
  }
  return createSession();
}

export function getSessionTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionCookie(res, token, { secure = false } = {}) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res, { secure = false } = {}) {
  const parts = [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function isRequestAuthenticated(req) {
  const token = getSessionTokenFromCookie(req.headers.cookie);
  return validateSession(token);
}

export function requireAdmin(req, res, next) {
  const token = getSessionTokenFromCookie(req.headers.cookie);
  if (token && validateSession(token)) {
    req.adminSession = token;
    return next();
  }
  res.status(401).json({ error: 'Потрібна авторизація' });
}

export function isSocketAuthenticated(socket) {
  const token = getSessionTokenFromCookie(socket.handshake.headers.cookie);
  return validateSession(token);
}
