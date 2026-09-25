# Авторизация

Статус: в работе (локальные файлы, до Supabase)

Сайт закрыт без аккаунта. После регистрации — обязательный опрос (2 экрана). При входе опрос только если `onboardingDone` ещё false.

## Где лежат люди

Папка **`data/users/`**. Один человек — один файл `{id}.json`.

Поля опросника в том же файле: `heightCm`, `birthDate`, `age`, `sex` (`male`/`female`), `weight`, `goals`, `daysPerWeek`, `onboardingDone`. Дневник топлива — `fuelLog` (дата UTC и список порций).

## API

Адрес: [`keys/links.json`](../keys/links.json) (локально `http://localhost:8787`). На телефоне в той же Wi-Fi страница `http://IP-компа:8081` сама ходит в API на этом IP. С другой сети: `npm run share` — API через `/api`. Без ключа ссылка одноразовая (`trycloudflare`). Постоянная: `NGROK_AUTHTOKEN` + `NGROK_DOMAIN` в `keys/.env`, либо именной Cloudflare Tunnel. См. [`keys/README.md`](../keys/README.md).

- `POST /register` — имя, почта, пароль
- `POST /login`
- `GET /me`
- `PATCH /me` — имя, статус; опрос (`onboardingDone: true`); правки профиля (`updateProfile: true`, стартовый вес не сбрасывается); дневник `fuelLog`
- `POST /logout`
- `GET /catalog` — тексты заданий дня (публично)
- `GET /barcode/:code` — штрихкод: Open Food Facts ru/world, затем USDA GTIN, КБЖУ на 100 г (публично)
- `GET /foods/search?q=` — поиск: локальная таблица + OFF + USDA (публично)

Запуск: `npm run dev` или `npm run server` + Expo.

## Админка

Отдельный вход: [`/admin`](http://localhost:8081/admin). Не вкладка приложения.

Пароль: `ADMIN_LOGIN` + `ADMIN_PASSWORD` в `keys/.env` (пароль от 10 символов). Шаблон — `keys/env.example`. Если env пустой, первый пароль пишется в `keys/admin/BOOTSTRAP.txt` (gitignore).

Сессия 8 часов, токен `adm_…`, хеш на диске, лимит попыток. В списках нет `passwordHash` и `tokens`.

- `POST /admin/login` / `POST /admin/logout`
- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/catalog` / `PUT /admin/catalog`
