# Авторизация

Статус: в работе (локальные файлы, до Supabase)

Сайт закрыт без аккаунта. После регистрации — обязательный опрос (2 экрана). При входе опрос только если `onboardingDone` ещё false.

## Где лежат люди

Папка **`data/users/`**. Один человек — один файл `{id}.json`.

Поля опросника в том же файле: `heightCm`, `birthDate`, `age`, `weight`, `goals`, `daysPerWeek`, `onboardingDone`.

## API

Адрес: [`keys/links.json`](../keys/links.json) (локально `http://localhost:8787`).

- `POST /register` — имя, почта, пароль
- `POST /login`
- `GET /me`
- `PATCH /me` — имя, статус; опрос (`onboardingDone: true`); правки профиля (`updateProfile: true`, стартовый вес не сбрасывается)
- `POST /logout`
- `GET /catalog` — тексты заданий дня (публично)

Запуск: `npm run dev` или `npm run server` + Expo.

## Админка

Отдельный вход: [`/admin`](http://localhost:8081/admin). Не вкладка приложения.

Пароль: `ADMIN_LOGIN` + `ADMIN_PASSWORD` в `keys/.env` (пароль от 10 символов). Шаблон — `keys/env.example`. Если env пустой, первый пароль пишется в `keys/admin/BOOTSTRAP.txt` (gitignore).

Сессия 8 часов, токен `adm_…`, хеш на диске, лимит попыток. В списках нет `passwordHash` и `tokens`.

- `POST /admin/login` / `POST /admin/logout`
- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/catalog` / `PUT /admin/catalog`
