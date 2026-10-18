# Авторизация

Статус: в работе (локальные файлы, до Supabase)

Сайт закрыт без аккаунта. После регистрации — обязательный опрос: тело и ИМТ, цели и стаж, затем шесть коротких вопросов и экран рекомендаций. На первом шаге из веса и роста сразу считается ИМТ. Вкладки закрыты, пока нет `onboardingDone` и `quizDone`. Старый аккаунт с телом, но без доп. опроса, видит только шесть вопросов и план.

## Где лежат люди

Папка **`data/users/`**. Один человек — один файл `{id}.json`.

Поля опросника в том же файле: `heightCm`, `birthDate`, `age`, `sex` (`male`/`female`), `weight`, `goals`, `daysPerWeek`, `experience` (`none` / `m1_3` / `m3_6` / `m6_12` / `y1`), `programLevel`, `levelProgress`, `progressLevel`, `onboardingDone`, `quizDone`, `quiz` (место, время, зоны, питание, что не ем, приёмы, фокус), `checkins`, `weeklyReviews`. Уровень программы растит сервер после засчитанной тренировки, клиент его не присылает. ИМТ из текущего веса и роста считается на клиенте, в файл не пишется. Дневник калорий — `fuelLog` (дата UTC и список порций). Серия — `streak`, щиты — `freezesLeft` (старт 1), последняя активность — `lastActivityDate`, дни тренировок — `activityDates`. Друзья — `friends` (id), пинки — `nudges`. Свои тренировки — `customSessions`.

## API

Адрес: [`keys/links.json`](../keys/links.json) (локально `http://localhost:8787`). На телефоне в той же Wi-Fi страница `http://IP-компа:8081` сама ходит в API на этом IP. С другой сети: `npm run share` — API через `/api`. Без ключа ссылка одноразовая (`trycloudflare`). Постоянная: `NGROK_AUTHTOKEN` + `NGROK_DOMAIN` в `keys/.env`, либо именной Cloudflare Tunnel. См. [`keys/README.md`](../keys/README.md).

- `POST /register` — имя, почта, пароль. Новый аккаунт с `emailVerified: false`, код на почту
- `POST /login`
- `POST /email/verify` — код с письма, сессия обязательна
- `POST /email/resend` — новый код
- `POST /password/forgot` — если аккаунт есть, код на почту на 15 минут
- `POST /password/reset` — почта, код, новый пароль. Старые сессии сбрасываются, сразу вход
- `GET /me`
- `PATCH /me` — имя, статус (можно пустой); опрос (`onboardingDone: true` и поля тела; `quiz` в том же запросе); доп. опрос (`saveQuiz: true`); дневной чек-ин `checkin`, «как зашло» `checkinFeel`, неделя `weeklyReview`; правки профиля (`updateProfile: true`, стартовый вес не сбрасывается); дневник `fuelLog`; `saveCustom` / `deleteCustom` — свои тренировки; `activityDone: true` — сначала сверка пропусков, потом серия +1 раз за UTC-день; `shieldNoticeSeen: true` — закрыть модалку щита; `avatarFace` / `avatarRing` — только открытые скины; `avatarPhoto` — своё фото; `nudgeSeen: true` — прочитать пинки
- `GET /people?q=` — поиск людей по имени, сессия обязательна
- `GET /people/:id` — открытый профиль: серия, щиты, тренировки, типы, медали. Без почты, веса и еды
- `GET /friends` — карточки подписок
- `POST /friends` — `{ id }`, не себя
- `DELETE /friends/:id`
- `POST /friends/:id/nudge` — пинк, 4 часа на пару, только из подписок
- `POST /logout`
- `GET /catalog` — тексты заданий дня (публично)
- `GET /barcode/:code` — штрихкод: локальный справочник, затем Open Food Facts ru/world и USDA. Если КБЖУ нет — Barcode List за названием (кэш в `data/cache`). Ориентир из обычной таблицы, если цифр нет (публично)
- `GET /foods/search?q=` — поиск: локальная таблица + OFF + USDA (публично)

Письма: Resend (`RESEND_API_KEY`) или SMTP (`MAIL_SMTP_HOST` / `USER` / `PASS` в `keys/.env`). Отправитель по умолчанию `onboarding@resend.dev` — без своего домена Resend шлёт только на почту аккаунта Resend, Яндекс и Gmail не приходят. Если письмо не ушло, код всё равно показывается в приложении. Старые карточки без поля считаются подтверждёнными.

Запуск: `npm run dev` или `npm run server` + Expo.

## Админка

Отдельный вход: [`/admin`](http://localhost:8081/admin). Не вкладка приложения. Поля админки с `autocomplete=off` и своими именами, чтобы браузер не подставлял эту пару в обычный вход. На регистрации пароль — `new-password`.

Пароль: `ADMIN_LOGIN` + `ADMIN_PASSWORD` в `keys/.env` (пароль от 10 символов). Шаблон — `keys/env.example`. Если env пустой, первый пароль пишется в `keys/admin/BOOTSTRAP.txt` (gitignore).

Сессия 8 часов, токен `adm_…`, хеш на диске, лимит попыток. В списках нет `passwordHash` и `tokens`.

- `POST /admin/login` / `POST /admin/logout`
- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/catalog` / `PUT /admin/catalog`
