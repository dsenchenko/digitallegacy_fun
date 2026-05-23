# Digital Legacy — Меню донатів OBS

Система нагород за донати для стрімінгу в реальному часі. Адмін-панель для активації дебафів/нагород, віджет OBS для відображення активних елементів з таймером.

## Швидкий старт

```bash
npm install
npm run dev
```

Запускає:
- **API + WebSocket сервер** на `http://localhost:3456`
- **React фронтенд** на `http://localhost:5173`

### URL-адреси

| Сторінка | URL | Призначення |
|----------|-----|-------------|
| Адмін-панель | http://localhost:5173/admin | Активація донатів, зміна цін, керування дебафами |
| Меню для глядачів | http://localhost:5173/menu | Список усіх нагород та цін |
| Віджет OBS | унікальний URL з адмін-панелі | Оверлей для джерела браузера в OBS |

## Налаштування OBS

1. У OBS додайте **Джерело браузера**
2. Скопіюйте **URL віджета OBS** з адмін-панелі (формат: `/widget/ваш-унікальний-токен`)
3. Ширина: **500**, висота: **400**
4. Увімкніть **Оновлювати браузер при активації сцени**
5. Вимкніть **Вимкнути джерело, коли не видиме** (зберігає WebSocket-з'єднання)
6. Фон прозорий — розмістіть джерело там, де потрібен оверлей

Коли ви активуєте донат з адмін-панелі, віджет миттєво оновлюється через WebSocket і показує:
- Назву категорії
- Назву дебафа/нагороди
- Ім'я донатера (якщо вказано)
- Таймер зворотного відліку з прогрес-баром (для нагород з таймером)

Нагороди з таймером автоматично зникають після закінчення часу. Нагороди без таймера залишаються видимими, доки ви не натиснете **Зупинити** в адмін-панелі.

## Авторизація адмін-панелі

`/admin` захищено паролем. Меню (`/menu`) та віджет OBS залишаються публічними.

**Перший запуск:** відкрийте `/admin` і створіть пароль (мінімум 4 символи). Пароль зберігається в `data/settings.json`.

**Через змінні середовища** (рекомендовано для продакшну):

```bash
cp .env.example .env
# Встановіть ADMIN_PASSWORD у .env
ADMIN_PASSWORD=your-secure-password npm start
```

Сесія триває 7 днів (httpOnly cookie). Кнопка **Вийти** в адмін-панелі завершує сесію.

У продакшні (`NODE_ENV=production`) cookies мають прапор Secure — **адмін-панель потребує HTTPS** (через nginx + Let's Encrypt або інший reverse proxy).

## Деплой на сервер

### Варіант 1: Docker (рекомендовано)

```bash
cp .env.example .env
# Відредагуйте .env — обовʼязково встановіть ADMIN_PASSWORD

npm run docker:build
npm run docker:up
```

Додаток слухає порт `3456` (або `HOST_PORT` з `.env`). Дані зберігаються у Docker volume `obs-menu-data` (`data/customizations.json`, `data/settings.json`).

Корисні команди:

```bash
npm run docker:logs   # логи
npm run docker:down   # зупинити
```

Перевірка здоровʼя: `GET /api/health`

### Варіант 2: PM2 (VPS без Docker)

```bash
git clone <repo> /opt/digital_legacy_obs_menu
cd /opt/digital_legacy_obs_menu

cp .env.example .env
# ADMIN_PASSWORD=... TRUST_PROXY=true

npm ci
npm run build
npm run pm2:start

pm2 save
pm2 startup   # один раз — автозапуск після перезавантаження
```

Оновлення після `git pull`:

```bash
npm run deploy:pm2
```

Корисні команди: `npm run pm2:logs`, `npm run pm2:restart`, `npm run pm2:stop`

nginx проксує домен на `127.0.0.1:3456` (див. `deploy/nginx.conf.example`).

### Варіант 3: VPS + systemd

```bash
git clone <repo> /opt/digital_legacy_obs_menu
cd /opt/digital_legacy_obs_menu
npm ci
npm run build

cp .env.example .env
# ADMIN_PASSWORD=... TRUST_PROXY=true

# systemd (приклад)
sudo cp deploy/digital-legacy-obs.service.example /etc/systemd/system/digital-legacy-obs.service
sudo systemctl daemon-reload
sudo systemctl enable --now digital-legacy-obs
```

### HTTPS + nginx

1. Запустіть додаток на `127.0.0.1:3456`
2. Скопіюйте `deploy/nginx.conf.example`, замініть `YOUR_DOMAIN`
3. `sudo certbot --nginx -d YOUR_DOMAIN`
4. У `.env` встановіть `TRUST_PROXY=true` (увімкнено за замовчуванням у prod)

nginx проксує HTTP і WebSocket (Socket.IO) на один upstream.

### Змінні середовища

| Змінна | Опис |
|--------|------|
| `ADMIN_PASSWORD` | Пароль адмін-панелі (рекомендовано для prod) |
| `PORT` | Порт сервера (за замовч.: 3456) |
| `HOST` | Адреса bind (за замовч.: 0.0.0.0) |
| `TRUST_PROXY` | `true` за reverse proxy — для HTTPS cookies |
| `NODE_ENV` | `production` для prod |
| `HOST_PORT` | Лише Docker Compose — зовнішній порт |

### OBS після деплою

- **Адмін:** `https://YOUR_DOMAIN/admin`
- **Меню:** `https://YOUR_DOMAIN/menu`
- **Віджет:** скопіюйте URL з адмін-панелі (`/widget/...`)

## Локальний продакшн

```bash
npm run build
npm start
```

Обслуговує API та фронтенд на порту `3456` (локально):

- Адмін: `http://localhost:3456/admin`
- Меню: `http://localhost:3456/menu`
- Віджет: унікальний URL з `/admin`

Для серверного деплою див. розділ **Деплой на сервер** вище.

## Категорії донатів

Усі донати налаштовані в `server/donations.js`:

- **Ігрові дебафи** — дебафи з таймером (5–10 хв)
- **Музика** — ручна зупинка
- **Взаємодія** — поєднання таймерних та ручних
- **Великі запити** — переважно ручні; марафон Hogwarts Legacy має таймер 3 год

Редагуйте `server/donations.js`, щоб змінити ціни, тривалість або додати нові нагороди.

## Архітектура

```
server/
  index.js      Express API + Socket.IO
  donations.js  Каталог донатів
  state.js      In-memory стан активних дебафів

src/
  pages/AdminPanel.jsx   Адмін UI
  pages/ObsWidget.jsx    OBS оверлей
  hooks/useActiveDebuffs.js  Спільний хук real-time стану
```

## API

| Метод | Endpoint | Опис |
|-------|----------|------|
| GET | `/api/health` | Health check для моніторингу / Docker |
| GET | `/api/donations` | Список усіх категорій донатів |
| GET | `/api/widget` | Унікальний токен і шлях віджета |
| POST | `/api/widget/regenerate` | Згенерувати нове посилання віджета |
| POST | `/api/categories` | Додати категорію `{ name }` |
| PATCH | `/api/categories/:id` | Перейменувати категорію `{ name }` |
| POST | `/api/categories/:id/donations` | Додати донат до категорії |
| PATCH | `/api/donations/:id/price` | Оновити ціну `{ price }` |
| GET | `/api/active` | Список активних дебафів |
| POST | `/api/active` | Активувати `{ donationId, donorName? }` |
| DELETE | `/api/active/:id` | Зупинити один дебаф |
| DELETE | `/api/active` | Очистити все |

Події Socket.IO: `active:update`, `active:activate`, `active:deactivate`, `active:clear`, `donations:update`, `donations:updatePrice`, `donations:addCategory`, `donations:renameCategory`, `donations:addDonation`

Кастомізації каталогу зберігаються в `data/customizations.json`. Токен віджета — у `data/settings.json`.
