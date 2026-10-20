# Авторизация

Статус: в работе (локальные файлы, до Supabase)

Сайт закрыт без аккаунта. После регистрации сразу вкладки и разминка. План по умолчанию: дом, час, пн · ср · пт. Карточка «подстроим план» на Главной, её можно пропустить. Тело, пол и рост — на Калориях, когда человек туда зайдёт. Google и Apple нет: почта и пароль, глазок, сброс с кодом на экране если письмо не дошло.

## Где лежат люди

Папка **`data/users/`**. Один человек — один файл `{id}.json`.

Поля опросника в том же файле: `heightCm`, `birthDate`, `age`, `sex` (`male`/`female`), `weight`, `goals`, `daysPerWeek`, `experience` (`none` / `m1_3` / `m3_6` / `m6_12` / `y1`), `programLevel`, `levelProgress`, `progressLevel`, `onboardingDone`, `quizDone`, `inviteHidden`, `quiz` (место, время, зоны, питание, что не ем, приёмы, фокус), `checkins`, `weeklyReviews`. Уровень программы растит сервер после засчитанной тренировки, клиент его не присылает. ИМТ из текущего веса и роста считается на клиенте, в файл не пишется. Дневник калорий — `fuelLog` (локальная дата и список порций). Часовой пояс — `timeZone`. Серия — `streak`, щиты — `freezesLeft` (старт 1), последняя активность — `lastActivityDate`, дни тренировок — `activityDates`. Друзья — `friends` (взаимные id), входящие заявки — `incomingRequests`, пинки — `nudges`. Свои тренировки — `customSessions`.

## API

Адрес: [`keys/links.json`](../keys/links.json) (локально `http://localhost:8787`). На телефоне в той же Wi-Fi страница `http://IP-компа:8081` сама ходит в API на этом IP. С другой сети: `npm run share` — API через `/api`. Без ключа ссылка одноразовая (`trycloudflare`). Постоянная: `NGROK_AUTHTOKEN` + `NGROK_DOMAIN` в `keys/.env`, либо именной Cloudflare Tunnel. См. [`keys/README.md`](../keys/README.md).

- `POST /register` — имя, почта, пароль. Сразу сессия и вкладки, почту не подтверждаем. В файл сразу план по умолчанию (дом, 60 мин, пн/ср/пт)
- `POST /login`
- `POST /email/verify` — код с письма, сессия обязательна. Сейчас экран не показывается
- `POST /email/resend` — новый код. Сейчас не зовём после регистрации
- `POST /password/forgot` — если аккаунт есть, код на почту на 15 минут. Код всегда в ответе; если SMTP задан, письмо идёт через него, не через Resend
- `POST /password/reset` — почта, код, новый пароль. Старые сессии сбрасываются, сразу вход
- `GET /me`
- `PATCH /me` — имя, статус (можно пустой); опрос (`onboardingDone: true` и поля тела; `quiz` в том же запросе); доп. опрос (`saveQuiz: true`); `inviteHidden: true` — больше не показывать инвайт; дневной чек-ин `checkin`, «как зашло» `checkinFeel`, неделя `weeklyReview`; правки профиля (`updateProfile: true`, стартовый вес не сбрасывается); дневник `fuelLog`; `saveCustom` / `deleteCustom` — свои тренировки; `gymLoad` / `gymLoadBump` — вес на упражнение в зале (история и +2,5 кг); `activityDone: true` плюс `elapsedSec` или `workSetsDone` — сначала сверка пропусков, потом серия +1 раз за локальный день; `shieldNoticeSeen: true` — закрыть модалку щита; `avatarFace` / `avatarRing` — только открытые скины; `avatarPhoto` — своё фото; `nudgeSeen: true` — прочитать пинки
- `GET /people?q=` — поиск людей по имени, сессия обязательна
- `GET /people/:id` — открытый профиль: серия, щиты, тренировки, типы, медали. Без почты, веса и еды
- `GET /friends` — взаимные карточки, входящие заявки, исходящие id
- `POST /friends` — `{ id }`: заявка, не себя. Если уже есть встречная — сразу друзья
- `POST /friends/:id/accept` — принять входящую
- `POST /friends/:id/decline` — отклонить входящую
- `DELETE /friends/:id` — убрать с обеих сторон
- `POST /friends/:id/nudge` — пинк, 4 часа на пару, только взаимным друзьям
- `POST /logout`
- `GET /invite-origin` — публичный адрес `npm run share`, чтобы ссылка другу была не localhost (публично)
- `GET /catalog` — тексты заданий дня (публично)
- `GET /barcode/:code` — штрихкод: локальный справочник, затем Open Food Facts ru/world и USDA. Если КБЖУ нет — Barcode List за названием (кэш в `data/cache`). Ориентир из обычной таблицы, если цифр нет (публично)
- `GET /foods/search?q=` — поиск: локальная таблица + OFF + USDA (публично)

Письма: подтверждение почты пока выключено — после регистрации сразу опрос. Сброс пароля по-прежнему шлёт код (Resend или SMTP). Отправитель по умолчанию `onboarding@resend.dev` — без своего домена Resend шлёт только на почту аккаунта Resend. Если письмо сброса не ушло, код всё равно в ответе API.

Запуск: `npm run dev` или `npm run server` + Expo.

## Админка

Отдельный вход: [`/admin`](http://localhost:8081/admin). Не вкладка приложения. Поля админки с `autocomplete=off` и своими именами, чтобы браузер не подставлял эту пару в обычный вход. На регистрации пароль — `new-password`.

Пароль: `ADMIN_LOGIN` + `ADMIN_PASSWORD` в `keys/.env` (пароль от 10 символов). Шаблон — `keys/env.example`. Если env пустой, первый пароль пишется в `keys/admin/BOOTSTRAP.txt` (gitignore).

Сессия 8 часов, токен `adm_…`, хеш на диске, лимит попыток. В списках нет `passwordHash` и `tokens`.

- `POST /admin/login` / `POST /admin/logout`
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/:id` — имя, почта, серия, щиты, пароль, подтверждение почты, отключение, сброс сессий или опроса. Пароль и токены не отдаём
- `DELETE /admin/users/:id` — файл человека и упоминания у друзей
- `GET /admin/catalog` / `PUT /admin/catalog`
