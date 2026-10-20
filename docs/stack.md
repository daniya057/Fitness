# Стек

Статус: в работе  
Цель стека: Time-to-Market, 60 FPS, поддержка небольшой командой.

Сейчас MVP крутится на **Expo + локальный Node API + JSON-файлы**. Supabase, лента, TanStack Query, RevenueCat — цель следующих фаз, в коде их нет.

## Фронтенд

| Слой | Сейчас | Цель |
|---|---|---|
| Приложение | Expo Managed + React Native, **JavaScript (JSX)** | то же |
| Стили | NativeWind | то же |
| Серверное состояние | `AuthContext` + `PATCH /me` | TanStack Query (лента, бесконечный скролл) |
| Клиентское состояние | Zustand (`sessionStore`) | то же |
| Анимации | Reanimated | + Moti |
| Видео | нет | `expo-video` для вертикальной ленты |

## Бэкенд

| Часть | Сейчас | Цель (Supabase) |
|---|---|---|
| Данные | `data/users/{id}.json`, `server/auth-server.js` на :8787 | PostgreSQL: профили, друзья, логи |
| Auth | почта + пароль, сессии в файле | Email, Google, Apple |
| Realtime | нет | лидерборды, активность друзей |
| Storage | аватар в JSON | видео ленты, аватары |
| Таймеры серии | сверка в `GET/PATCH /me` и раз в 15 мин | Edge Functions |

## Монетизация и аналитика

Ещё не подключены. Фаза 4: RevenueCat, Amplitude или Mixpanel.
