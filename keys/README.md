# Ссылки и ключи

Все адреса и секреты — в этой папке. Не клади пароли в git.

## Ссылки (`links.json`)

| Что | Адрес |
|---|---|
| Приложение | http://localhost:8081 |
| Админка | http://localhost:8081/admin |
| API | http://localhost:8787 |

## Ключи

1. Скопируй `env.example` в файл **`.env`** в этой же папке (не правь только example — сервер его не читает).
2. Задай `ADMIN_PASSWORD` (от 10 символов).
3. Если `.env` нет, первый пароль админки появится в `admin/BOOTSTRAP.txt`.

`USDA_API_KEY` — необязательно. Без него поиск КБЖУ ходит в USDA с `DEMO_KEY` (общий лимит). Свой ключ: https://fdc.nal.usda.gov/api-key-signup

`admin/` — сессии и хеш пароля админа. В git не попадает.

Приложение на вебе берёт хост API из адреса страницы (телефон в Wi-Fi стучится в IP компа, не в свой localhost). Явно задать адрес можно через `EXPO_PUBLIC_API_URL`. Сервер читает `.env` отсюда при старте.

## Телефон в той же Wi-Fi

1. На компе: `npm run dev`.
2. `ipconfig` → IPv4 Wi-Fi, например `192.168.0.12`.
3. На телефоне в браузере: `http://192.168.0.12:8081` (без https). Админка: `http://192.168.0.12:8081/admin`.
4. Если не открывается — разреши в брандмауэре Windows входящие TCP **8081** и **8787**.

## С другой сети (не та же Wi-Fi)

Комп остаётся сервером. Без ключа `npm run share` даёт **одноразовый** `trycloudflare.com` — адрес меняется и отваливается.

### Постоянный адрес (ngrok, бесплатно)

Один и тот же `https://….ngrok-free.app` при каждом запуске. Домен аккаунта, свой покупать не нужно.

1. Регистрация: https://dashboard.ngrok.com/signup
2. Токен: https://dashboard.ngrok.com/get-started/your-authtoken
3. Домен: https://dashboard.ngrok.com/domains — скопируй вида `что-то.ngrok-free.app`
4. В `keys/.env`:
   ```
   NGROK_AUTHTOKEN=твой_токен
   NGROK_DOMAIN=что-то.ngrok-free.app
   ```
5. `npm run dev`, в другом окне `npm run share`. На телефоне открывай этот домен. Админка: тот же адрес + `/admin`.
6. Окно `share` не закрывай, комп не усыпляй — без этого туннеля нет, но **ссылка не меняется**.

На бесплатном плане ngrok может показать промежуточную страницу «Visit Site» — один тап и дальше обычный сайт.

### Свой домен (Cloudflare Tunnel)

Если домен уже в Cloudflare: Zero Trust → Networks → Tunnels → Create → скопируй токен установки. В `.env`: `CLOUDFLARE_TUNNEL_TOKEN` и `SHARE_PUBLIC_URL=https://твой.домен`. Тогда `npm run share` поднимает именной туннель.

Круглосуточно без компа — только хостинг (VPS), не туннель с ноутбука.

## Приложение на iPhone

Не сайт «на экран Домой». Канон: [`docs/ios.md`](../docs/ios.md).

Бесплатно, любая сеть: Expo Go + на компе `npm run go` (нужны `NGROK_AUTHTOKEN` и `NGROK_DOMAIN` выше). QR в терминале. Комп не усыпляй.

Свою иконку без Apple Developer не собрать.

