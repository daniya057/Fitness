# Авторизация

Статус: в работе (локальные файлы, до Supabase)

Пока сайт не пускает без аккаунта. Регистрация и вход идут через `server/auth-server.js`.

## Где лежат люди

Папка **`data/users/`**. Один человек — один файл `{id}.json`. Пароль только как scrypt. JSON с анкетами в git не коммитим.

## API (`http://localhost:8787`)

- `POST /register` — имя, почта, пароль, опционально вес
- `POST /login`
- `GET /me`
- `PATCH /me` — имя и статус
- `POST /logout`

Запуск: `npm run server`. Клиент: `npx expo start --web`.

Позже это заменит Supabase Auth; форма полей та же.
