# Документация

Источник правды по продукту, стеку и плану. Код не заменяет эти файлы: при изменении фичи обновляй соответствующий документ в том же изменении.

## Карта

| Файл | О чём |
|---|---|
| [product.md](product.md) | Видение, аудитория, формула продукта |
| [ux.md](ux.md) | ADHD-friendly UI, онбординг, тон |
| [stack.md](stack.md) | Технологический стек и зачем |
| [architecture.md](architecture.md) | Папки, слои, паттерны кода |
| [database.md](database.md) | Схема Postgres, RLS, Storage |
| [auth.md](auth.md) | Вход Email / Google / Apple |
| [navigation.md](navigation.md) | Вкладки и экраны |
| [screens/arena.md](screens/arena.md) | Экран Арена |
| [screens/tabs.md](screens/tabs.md) | Пять вкладок, портрет |
| [roadmap.md](roadmap.md) | Фазы и спринты с чекбоксами |
| [glossary.md](glossary.md) | Термины |
| [analytics.md](analytics.md) | События Amplitude / Mixpanel |
| [changelog.md](changelog.md) | Журнал документации |
| [design-tokens.md](design-tokens.md) | Цвета и шрифты |
| [decisions.md](decisions.md) | Короткие архитектурные решения |

## Механики

| Файл | О чём |
|---|---|
| [mechanics/streaks.md](mechanics/streaks.md) | Прощающая серия, щиты, Edge Function |
| [mechanics/quick-start.md](mechanics/quick-start.md) | 10 секунд, «Засчитать разминку» |
| [mechanics/daily.md](mechanics/daily.md) | Ежедневные челленджи |
| [mechanics/avatar.md](mechanics/avatar.md) | Аватар, XP, уровни, бейджи |
| [mechanics/feed.md](mechanics/feed.md) | Вертикальная лента |
| [mechanics/social.md](mechanics/social.md) | Друзья, лидерборд, парная серия |
| [mechanics/economy.md](mechanics/economy.md) | Freemium, щиты, рефералка |

## Как вести доки

1. Писать по-русски. Имена таблиц, пакетов и полей — как в коде (английский).
2. Не оставлять «позже уточним», если решение уже принято в чате — сразу в файл.
3. Статус фичи: `черновик` / `в работе` / `готово`. Пока нет кода — `черновик`.
4. После спринта отмечать чекбоксы в `roadmap.md` и короткую запись в `changelog.md`.
