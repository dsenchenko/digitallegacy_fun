import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import {
  addCategory,
  addDonation,
  getCategories,
  renameCategory,
  subscribe as subscribeCatalog,
  updatePrice,
  updateDuration,
  updateName,
  deleteDonation,
  deleteCategory,
} from './catalog.js';
import {
  activateDebuff,
  clearAllDebuffs,
  deactivateDebuff,
  getActiveDebuffs,
  subscribe,
  subscribeExpired,
} from './state.js';
import {
  getWidgetInfo,
  isValidWidgetToken,
  regenerateWidgetToken,
} from './widgetToken.js';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionTokenFromCookie,
  getAuthSource,
  isAuthConfigured,
  isRequestAuthenticated,
  isSocketAuthenticated,
  login,
  requireAdmin,
  setAdminPassword,
  setSessionCookie,
} from './auth.js';
import {
  GIVEAWAY_IMAGES_DIR,
  addParticipant,
  createGiveaway,
  deleteGiveaway,
  drawWinner,
  getGiveawayAdmin,
  getPublicGiveaways,
  removeParticipant,
  resolveImagePath,
  setGiveawayWidgetDisplay,
  subscribe as subscribeGiveaways,
  updateGiveaway,
  updateParticipant,
} from './giveaways.js';
import { proxyDonateGet, proxyDonatePost } from './donateProxy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT) || 3456;
const HOST = process.env.HOST || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';
const trustProxy =
  process.env.TRUST_PROXY === 'true' ||
  process.env.TRUST_PROXY === '1' ||
  (isProd && process.env.TRUST_PROXY !== 'false');

const app = express();
const httpServer = createServer(app);

if (trustProxy) {
  app.set('trust proxy', 1);
}
const io = new Server(httpServer, {
  cors: {
    origin: isProd ? false : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

function rejectUnlessAdmin(socket, callback) {
  if (!isSocketAuthenticated(socket)) {
    callback?.({ ok: false, error: 'Потрібна авторизація' });
    return false;
  }
  return true;
}

function isSecureRequest(req) {
  if (req.secure) return true;
  const forwarded = req.headers['x-forwarded-proto'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim() === 'https';
  }
  return false;
}

function useSecureCookie(req) {
  return isProd && isSecureRequest(req);
}

fs.mkdirSync(GIVEAWAY_IMAGES_DIR, { recursive: true });

const giveawayUpload = multer({
  storage: multer.diskStorage({
    destination: GIVEAWAY_IMAGES_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${uuidv4().slice(0, 12)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Дозволені лише зображення'));
  },
});

app.use(cors({ origin: isProd ? false : 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/digitallegacyua', proxyDonateGet);
app.post('/digitallegacyua', proxyDonatePost);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    configured: isAuthConfigured(),
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    authenticated: isRequestAuthenticated(req),
    configured: isAuthConfigured(),
    authSource: getAuthSource(),
  });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const token = login(req.body?.password);
    setSessionCookie(res, token, { secure: useSecureCookie(req) });
    res.json({ ok: true });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = getSessionTokenFromCookie(req.headers.cookie);
  destroySession(token);
  clearSessionCookie(res, { secure: useSecureCookie(req) });
  res.json({ ok: true });
});

app.post('/api/auth/setup', (req, res) => {
  if (isAuthConfigured()) {
    return res.status(403).json({ error: 'Пароль уже налаштовано' });
  }
  try {
    setAdminPassword(req.body?.password);
    const token = createSession();
    setSessionCookie(res, token, { secure: useSecureCookie(req) });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/donations', (_req, res) => {
  res.json({ categories: getCategories() });
});

app.patch('/api/donations/:id/price', requireAdmin, (req, res) => {
  const { price } = req.body ?? {};
  if (price === undefined) {
    return res.status(400).json({ error: 'Потрібен параметр price' });
  }
  try {
    const donation = updatePrice(req.params.id, price);
    res.json({ donation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/donations/:id/duration', requireAdmin, (req, res) => {
  const { durationMinutes } = req.body ?? {};
  if (durationMinutes === undefined) {
    return res.status(400).json({ error: 'Потрібен параметр durationMinutes' });
  }
  try {
    const donation = updateDuration(req.params.id, durationMinutes);
    res.json({ donation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/donations/:id/name', requireAdmin, (req, res) => {
  const { name } = req.body ?? {};
  if (name === undefined) {
    return res.status(400).json({ error: 'Потрібен параметр name' });
  }
  try {
    const donation = updateName(req.params.id, name);
    res.json({ donation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/donations/:id', requireAdmin, (req, res) => {
  try {
    deleteDonation(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/categories', requireAdmin, (req, res) => {
  try {
    const category = addCategory(req.body?.name);
    res.status(201).json({ category });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/categories/:id', requireAdmin, (req, res) => {
  try {
    const category = renameCategory(req.params.id, req.body?.name);
    res.json({ category });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  try {
    deleteCategory(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/categories/:id/donations', requireAdmin, (req, res) => {
  try {
    const donation = addDonation(req.params.id, req.body ?? {});
    res.status(201).json({ donation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/active', (_req, res) => {
  res.json({ active: getActiveDebuffs() });
});

app.post('/api/active', requireAdmin, (req, res) => {
  const { donationId, donorName } = req.body ?? {};
  if (!donationId) {
    return res.status(400).json({ error: 'Потрібен параметр donationId' });
  }
  try {
    const debuff = activateDebuff(donationId, donorName);
    res.status(201).json({ debuff });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/active/:id', requireAdmin, (req, res) => {
  const removed = deactivateDebuff(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Активний дебаф не знайдено' });
  }
  res.json({ ok: true });
});

app.delete('/api/active', requireAdmin, (_req, res) => {
  clearAllDebuffs();
  res.json({ ok: true });
});

app.get('/api/widget', requireAdmin, (_req, res) => {
  res.json(getWidgetInfo());
});

app.get('/api/widget/validate/:token', (req, res) => {
  res.json({ valid: isValidWidgetToken(req.params.token) });
});

app.post('/api/widget/regenerate', requireAdmin, (_req, res) => {
  const token = regenerateWidgetToken();
  res.json({ token, path: `/widget/${token}` });
});

app.get('/api/giveaways', (_req, res) => {
  res.json({ giveaways: getPublicGiveaways() });
});

app.get('/api/giveaways/images/:filename', (req, res) => {
  try {
    res.sendFile(resolveImagePath(req.params.filename));
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/api/giveaways/:id', requireAdmin, (req, res) => {
  try {
    res.json({ giveaway: getGiveawayAdmin(req.params.id) });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.post(
  '/api/giveaways',
  requireAdmin,
  giveawayUpload.single('image'),
  (req, res) => {
    try {
      const giveaway = createGiveaway({
        title: req.body?.title,
        description: req.body?.description,
        ticketPriceUah: req.body?.ticketPriceUah,
        imageFilename: req.file?.filename ?? null,
      });
      res.status(201).json({ giveaway });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.patch('/api/giveaways/:id', requireAdmin, (req, res) => {
  try {
    const giveaway = updateGiveaway(req.params.id, req.body ?? {});
    res.json({ giveaway });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/giveaways/:id', requireAdmin, (req, res) => {
  try {
    deleteGiveaway(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/giveaways/:id/participants', requireAdmin, (req, res) => {
  try {
    const participant = addParticipant(req.params.id, req.body ?? {});
    res.status(201).json({ participant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/giveaways/:id/participants/:participantId', requireAdmin, (req, res) => {
  try {
    const participant = updateParticipant(
      req.params.id,
      req.params.participantId,
      req.body ?? {}
    );
    res.json({ participant });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete(
  '/api/giveaways/:id/participants/:participantId',
  requireAdmin,
  (req, res) => {
    try {
      removeParticipant(req.params.id, req.params.participantId);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

app.post('/api/giveaways/:id/draw', requireAdmin, (req, res) => {
  try {
    const giveaway = drawWinner(req.params.id);
    res.json({ giveaway });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/giveaways/:id/widget', requireAdmin, (req, res) => {
  try {
    const giveaway = setGiveawayWidgetDisplay(
      req.params.id,
      req.body?.visible
    );
    res.json({ giveaway });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.emit('active:update', getActiveDebuffs());
  socket.emit('donations:update', getCategories());
  socket.emit('giveaways:update', getPublicGiveaways());

  socket.on('donations:updatePrice', ({ donationId, price }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const donation = updatePrice(donationId, price);
      callback?.({ ok: true, donation });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:updateDuration', ({ donationId, durationMinutes }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const donation = updateDuration(donationId, durationMinutes);
      callback?.({ ok: true, donation });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:updateName', ({ donationId, name }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const donation = updateName(donationId, name);
      callback?.({ ok: true, donation });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:addCategory', ({ name }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const category = addCategory(name);
      callback?.({ ok: true, category });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:renameCategory', ({ categoryId, name }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const category = renameCategory(categoryId, name);
      callback?.({ ok: true, category });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:addDonation', ({ categoryId, donation }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const created = addDonation(categoryId, donation);
      callback?.({ ok: true, donation: created });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:deleteDonation', ({ donationId }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      deleteDonation(donationId);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('donations:deleteCategory', ({ categoryId }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      deleteCategory(categoryId);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('active:activate', ({ donationId, donorName }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const debuff = activateDebuff(donationId, donorName);
      callback?.({ ok: true, debuff });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('active:deactivate', ({ id }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    const removed = deactivateDebuff(id);
    callback?.({ ok: removed });
  });

  socket.on('active:clear', (_payload, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    clearAllDebuffs();
    callback?.({ ok: true });
  });

  socket.on('giveaways:addParticipant', ({ giveawayId, ...payload }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const participant = addParticipant(giveawayId, payload);
      callback?.({ ok: true, participant });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on(
    'giveaways:updateParticipant',
    ({ giveawayId, participantId, ...fields },
    callback
  ) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const participant = updateParticipant(giveawayId, participantId, fields);
      callback?.({ ok: true, participant });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on(
    'giveaways:removeParticipant',
    ({ giveawayId, participantId },
    callback
  ) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      removeParticipant(giveawayId, participantId);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('giveaways:draw', ({ giveawayId }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const giveaway = drawWinner(giveawayId);
      callback?.({ ok: true, giveaway });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('giveaways:update', ({ giveawayId, ...fields }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const giveaway = updateGiveaway(giveawayId, fields);
      callback?.({ ok: true, giveaway });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('giveaways:delete', ({ giveawayId }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      deleteGiveaway(giveawayId);
      callback?.({ ok: true });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });

  socket.on('giveaways:setWidget', ({ giveawayId, visible }, callback) => {
    if (!rejectUnlessAdmin(socket, callback)) return;
    try {
      const giveaway = setGiveawayWidgetDisplay(giveawayId, visible);
      callback?.({ ok: true, giveaway });
    } catch (err) {
      callback?.({ ok: false, error: err.message });
    }
  });
});

subscribe((active) => {
  io.emit('active:update', active);
});

subscribeExpired((expired) => {
  io.emit('active:expired', expired);
});

subscribeCatalog((categories) => {
  io.emit('donations:update', categories);
});

subscribeGiveaways((giveaways) => {
  io.emit('giveaways:update', giveaways);
});

httpServer.listen(PORT, HOST, () => {
  const { path: widgetPath } = getWidgetInfo();
  console.log(`Сервер працює на http://${HOST}:${PORT}`);
  if (isProd && !isAuthConfigured()) {
    console.warn(
      'УВАГА: ADMIN_PASSWORD не задано. Негайно відкрийте /admin або встановіть пароль.'
    );
  } else if (!isAuthConfigured()) {
    console.log('Пароль адміна не налаштовано — відкрийте /admin для створення');
  }
  if (trustProxy) {
    console.log('Trust proxy увімкнено (reverse proxy / HTTPS)');
  }
  if (!isProd) {
    console.log(`Адмін-панель: http://localhost:5173/admin`);
    console.log(`Меню для глядачів: http://localhost:5173/menu`);
    console.log(`Віджет OBS:   http://localhost:5173${widgetPath}`);
  } else {
    console.log(`Адмін-панель: /admin`);
    console.log(`Меню для глядачів: /menu`);
    console.log(`Віджет OBS:   ${widgetPath}`);
  }
});

function shutdown(signal) {
  console.log(`${signal} — зупинка сервера...`);
  httpServer.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
