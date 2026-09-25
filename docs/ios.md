# iPhone: можно ли поставить

Статус: принято (пока без EAS-сборки)

Да. Код уже **Expo + React Native**. Один проект: сайт в Safari, **Expo Go**, позже IPA / TestFlight.

App Store и своя иконка «Fitness» бесплатно нельзя. Бесплатно — оболочка Expo Go.

Пока API — локальный `server/auth-server.js` на компе. Без включённого компа аккаунты и дневник не откроются.

`ios.bundleIdentifier` и EAS в репо нет. Сборку не стартуем без Apple Developer и явного «собирай».

## Expo Go с любой сети (бесплатно)

1. На iPhone: [Expo Go](https://apps.apple.com/app/expo-go/id982107779).
2. В `keys/.env`: `NGROK_AUTHTOKEN` и `NGROK_DOMAIN` (см. [keys/README.md](../keys/README.md)).
3. На компе: `npm run go` (PowerShell, если ругается на npm: `cmd /c "npm run go"`). Не закрывать.
4. В терминале QR. В Expo Go сканируешь — Fitness внутри Go, хоть 4G, хоть чужой Wi-Fi.
5. Если tunnel попросит войти — бесплатный аккаунт [expo.dev](https://expo.dev).

Скрипт поднимает API, ngrok (`/api`) и Metro `--tunnel`. Клиент берёт `EXPO_PUBLIC_API_URL=https://домен/api`, не localhost. Токен на телефоне — SecureStore.

Лимиты: не иконка в сторе; ngrok может показать «Visit Site»; комп не в сне. Не запускай параллельно второй `npm run share` — порт шлюза 8790.

Сайт в браузере по-прежнему: `npm run dev` + `npm run share`.

## Своя иконка / App Store

Нужен [Apple Developer](https://developer.apple.com) (~99 USD/год) и EAS. Имеет смысл, когда API не на ноутбуке.

## Safari

«На экран Домой» — ярлык сайта, не приложение из стора.
