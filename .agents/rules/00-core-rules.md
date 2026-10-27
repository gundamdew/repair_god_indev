# Repair God — Core Rules & Operational Guidelines

> **Always-On Workspace Rule**  
> **Precedence Order:** `AGENTS.md` > `docs/architecture/backend-stack.md` > `docs/architecture/frontend-stack.md` > `docs/fsm.md` > `.agents/rules/`

---

## 1. Контекст и Источники Правды
- **Проект:** Repair God (`repair_god_indev`)
- **Источники правды по порядку приоритета:**
  1. `AGENTS.md`
  2. `docs/architecture/backend-stack.md`
  3. `docs/architecture/frontend-stack.md`
  4. `docs/fsm.md`
  5. `.agents/rules/`

---

## 2. Технологический Стек
- **Язык и монорепо:** TypeScript 5+, pnpm workspaces + Turborepo
- **Backend:** NestJS (Fastify), PostgreSQL 16 (PostGIS, pgvector), Prisma, Redis + BullMQ, S3-совместимое хранилище (MinIO локально)
- **Mobile:** React Native + Expo (Expo Router), NativeWind, TanStack Query v5, Zustand, React Hook Form + Zod
- **Web:** Next.js (`apps/web-customer`), Vite SPA (`apps/web-workshop`)

---

## 3. Структура Монорепо
- `apps/mobile`: Мобильное приложение B2C клиентов (React Native / Expo)
- `apps/api`: Основной backend (NestJS / Fastify)
- `apps/web-customer`: Публичный веб-портал и лендинг (Next.js)
- `apps/web-workshop`: Рабочее место мастера/сервиса (Vite SPA)
- `packages/contracts`: Zod-схемы и DTO (источник правды для API)
- `packages/api-client`: Сгенерированный клиент API и хуки
- `packages/ui-tokens`: Общие токены дизайна (Tailwind / NativeWind)
- `packages/shared-utils`: Общие утилиты
- `packages/fsm`: Машина состояний жизненного цикла заказов и доставок
- `packages/tsconfig`: Базовые конфигурации TypeScript

---

## 4. Системные Роли (RBAC)
- `CUSTOMER` — Конечный клиент (B2C)
- `TECHNICIAN` — Сервисный мастер/техник
- `WORKSHOP_OWNER` — Владелец партнерского сервисного центра
- `ENTERPRISE_MANAGER` — Менеджер корпоративного парка (B2B)
- `PLATFORM_ADMIN` — Администратор платформы Repair God

---

## 5. Обязательные Правила Работы (Always-On Rules)

1. **Режим Planning:** Сначала предоставь четкий план, жди подтверждения пользователя перед выполнением.
2. **Ограничение изменений:** Меняй файлы только в указанных в задаче каталогах. Директории `packages/contracts` и `packages/fsm` запрещено менять без явного разрешения в постановке задачи.
3. **Контракты на Zod:** Схемы Zod — единственный источник правды для API. OpenAPI спецификации и `packages/api-client` генерируются строго из них.
4. **Доменная архитектура и FSM:** Бизнес-логика размещается только в доменных модулях. Любой переход статуса заказа или доставки осуществляется исключительно через `packages/fsm`. Прямые мутации статусов в БД запрещены.
5. **Финансовые расчеты:** Деньги хранятся и рассчитываются только в целых единицах (`grosz`), валюта PLN. Использование чисел с плавающей точкой (`float` / `double`) для денег категорически запрещено.
6. **Защита клиента:** Цена и объём работ могут меняться только с явного подтверждения клиента (escrow invariance).
7. **Изоляция внешних сервисов:** Любые внешние сервисы (InPost, PayU/P24/Stripe, AI) подключаются только через интерфейсы-порты (Hexagonal Architecture / Ports & Adapters). Название AI-модели и API-ключи хранятся только в конфигурации / `.env`, хардкод в кодовой базе запрещен.
8. **Безопасность данных и секреты:** Секреты, токены и приватные ключи ни при каких обстоятельствах не коммитятся в репозиторий.
9. **Критерии завершения задачи:** Все тесты проходят, `lint` и `typecheck` чистые (без ошибок и предупреждений), предоставлен итоговый отчёт (что сделано, что не сделано, принятые допущения).
10. **Принцип однозначности:** При любой неопределенности или неоднозначности — остановись и уточни у пользователя.
