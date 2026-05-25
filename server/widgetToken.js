import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

/** @type {{ widgetToken?: string }} */
let settings = loadSettings();

function loadSettings() {
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

function saveSettings() {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function createToken() {
  return randomBytes(24).toString('hex');
}

export function getWidgetToken() {
  if (!settings.widgetToken) {
    settings.widgetToken = createToken();
    saveSettings();
  }
  return settings.widgetToken;
}

export function regenerateWidgetToken() {
  settings.widgetToken = createToken();
  saveSettings();
  return settings.widgetToken;
}

export function isValidWidgetToken(token) {
  return typeof token === 'string' && token === getWidgetToken();
}

export function getWidgetInfo() {
  const token = getWidgetToken();
  return { token, path: `/widgets/${token}` };
}
