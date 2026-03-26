# Inventory REST API

Серверная часть для инвентаризации оборудования с использованием QR-кодов.

## Стек технологий

- Node.js
- NestJS 11
- TypeScript
- PostgreSQL 17
- TypeORM
- Redis
- JWT + Passport (access/refresh)
- class-validator + class-transformer
- Swagger

## Сущности

| Сущность        | Назначение                                     | Ключевые поля                                                         |
| --------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| User            | Пользователь системы                           | id, email, fullName, roleId, isActive                                 |
| Role            | Роль пользователя                              | id, name (ADMIN/USER)                                                 |
| Equipment       | Учетная единица оборудования                   | id, inventoryNumber, name, serialNumber, locationId, statusId, typeId |
| Location        | Справочник локаций                             | id, name                                                              |
| EquipmentType   | Справочник типов оборудования                  | id, name                                                              |
| EquipmentStatus | Справочник статусов оборудования               | id, name                                                              |
| Inventory       | Сессия инвентаризации                          | id, startedAt, finishedAt, createdBy, status                          |
| InventoryRecord | Результат сканирования в рамках инвентаризации | id, inventoryId, equipmentId, scannedAt, comment, resultStatus        |

## Структура проекта

| Папка                          | Назначение                                         |
| ------------------------------ | -------------------------------------------------- |
| src                            | Исходный код приложения                            |
| src/common                     | Общие константы, guard-ы, декораторы               |
| src/modules                    | Бизнес-модули API                                  |
| src/modules/auth               | Аутентификация: login/refresh/logout/logout-all/me |
| src/modules/users              | Управление пользователями и ролями                 |
| src/modules/equipment          | Оборудование, поиск, фильтры, пагинация            |
| src/modules/locations          | CRUD локаций                                       |
| src/modules/equipment-types    | CRUD типов оборудования                            |
| src/modules/equipment-statuses | CRUD статусов оборудования                         |
| src/modules/inventories        | Создание и закрытие инвентаризаций                 |
| src/modules/inventory-records  | Записи сканирования (FOUND/DAMAGED)                |
| src/redis                      | Работа с Redis и сессиями                          |
| src/database                   | Конфигурация БД и миграции                         |
| test                           | e2e тесты                                          |

## Как запустить

### 1) Клонирование проекта

```bash
git clone https://github.com/NekitBST/inventory_server.git
cd inventory_server
```

### 2) Установка зависимостей

```bash
npm install
```

### 3) Конфиг окружения

Создай `.env` на базе `.env.example` и заполни значения.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_TTL_SECONDS=604800

// Логин дефолтного админа для миграции
ADMIN_LOGIN=your_admin_login
// Пароль дефолтного админа для миграции
ADMIN_PASSWORD=your_admin_password

PORT=3000
```

### 4) Миграции

```bash
npm run migrate:up
```

### 5) Запуск

```bash
npm run start
```

Swagger:

- http://localhost:3000/swagger

## API маршруты

| Метод  | URL                                          | Описание                                  | Авторизация (Да / Нет) |
| ------ | -------------------------------------------- | ----------------------------------------- | ---------------------- |
| POST   | /auth/login                                  | Вход пользователя                         | Нет                    |
| POST   | /auth/refresh                                | Обновление access/refresh токенов         | Нет                    |
| POST   | /auth/logout                                 | Выход на текущем устройстве               | Да                     |
| POST   | /auth/logout-all                             | Выход на всех устройствах                 | Да                     |
| GET    | /auth/me                                     | Текущий пользователь                      | Да                     |
| GET    | /users                                       | Список пользователей (ADMIN)              | Да                     |
| GET    | /users/:id                                   | Пользователь по id (ADMIN)                | Да                     |
| POST   | /users                                       | Создать пользователя (ADMIN)              | Да                     |
| PATCH  | /users/:id                                   | Обновить пользователя (ADMIN)             | Да                     |
| DELETE | /users/:id                                   | Деактивировать пользователя (ADMIN)       | Да                     |
| GET    | /equipment                                   | Список оборудования (фильтры + пагинация) | Да                     |
| GET    | /equipment/:id                               | Оборудование по UUID                      | Да                     |
| GET    | /equipment/by-inventory/:inventoryNumber     | Оборудование по инвентарному номеру       | Да                     |
| POST   | /equipment                                   | Создать оборудование                      | Да                     |
| PATCH  | /equipment/:id                               | Обновить оборудование                     | Да                     |
| DELETE | /equipment/:id                               | Удалить оборудование                      | Да                     |
| GET    | /locations                                   | Список локаций                            | Да                     |
| GET    | /locations/:id                               | Локация по id                             | Да                     |
| POST   | /locations                                   | Создать локацию                           | Да                     |
| PATCH  | /locations/:id                               | Обновить локацию                          | Да                     |
| DELETE | /locations/:id                               | Удалить локацию                           | Да                     |
| GET    | /equipment-types                             | Список типов                              | Да                     |
| GET    | /equipment-types/:id                         | Тип по id                                 | Да                     |
| POST   | /equipment-types                             | Создать тип                               | Да                     |
| PATCH  | /equipment-types/:id                         | Обновить тип                              | Да                     |
| DELETE | /equipment-types/:id                         | Удалить тип                               | Да                     |
| GET    | /equipment-statuses                          | Список статусов                           | Да                     |
| GET    | /equipment-statuses/:id                      | Статус по id                              | Да                     |
| POST   | /equipment-statuses                          | Создать статус                            | Да                     |
| PATCH  | /equipment-statuses/:id                      | Обновить статус                           | Да                     |
| DELETE | /equipment-statuses/:id                      | Удалить статус                            | Да                     |
| POST   | /inventories                                 | Создать инвентаризацию                    | Да                     |
| GET    | /inventories                                 | Список инвентаризаций                     | Да                     |
| GET    | /inventories/:id                             | Инвентаризация по UUID                    | Да                     |
| PATCH  | /inventories/:id/close                       | Закрыть инвентаризацию                    | Да                     |
| POST   | /inventory-records                           | Добавить запись сканирования              | Да                     |
| GET    | /inventory-records/by-inventory/:inventoryId | Записи по инвентаризации                  | Да                     |
| PATCH  | /inventory-records/:id                       | Обновить запись инвентаризации            | Да                     |

## Пагинация и фильтры (оборудование)

Эндпоинт `GET /equipment` поддерживает:

- пагинацию: `page` (>= 1), `limit` (1..100)
- фильтры: `statusId`, `typeId`, `locationId`
- полнотекстовый поиск: `search` (по `inventoryNumber`, `name`, `serialNumber`)

Пример:

```http
GET /equipment?page=1&limit=20&statusId=1&typeId=2&search=lenovo
Authorization: Bearer <accessToken>
```

Пример ответа:

```json
{
  "items": [
    {
      "id": "10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa",
      "inventoryNumber": "INV-000123",
      "name": "Ноутбук Lenovo ThinkPad",
      "serialNumber": "SN-ABC-12345",
      "locationId": 2,
      "statusId": 1,
      "typeId": 3,
      "location": { "id": 2, "name": "Кабинет 101" },
      "status": { "id": 1, "name": "в работе" },
      "type": { "id": 3, "name": "Ноутбук" },
      "createdAt": "2026-03-26T09:00:00.000Z",
      "updatedAt": "2026-03-26T09:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

## Примеры запросов и ответов

### 1) Авторизация: login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "StrongPass123!"
}
```

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### 2) Пользователи: create

```http
POST /users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "user1@example.com",
  "password": "StrongPass123!",
  "fullName": "Иван Петров",
  "roleId": 2
}
```

```json
{
  "id": "d2256e7e-c539-4b2d-b9cf-71035fef175b",
  "email": "user1@example.com",
  "fullName": "Иван Петров",
  "roleId": 2,
  "isActive": true,
  "createdAt": "2026-03-26T10:00:00.000Z",
  "updatedAt": "2026-03-26T10:00:00.000Z"
}
```

### 3) Оборудование: create

```http
POST /equipment
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "inventoryNumber": "INV-000123",
  "name": "Ноутбук Lenovo ThinkPad",
  "serialNumber": "SN-ABC-12345",
  "locationId": 1,
  "statusId": 1,
  "typeId": 2
}
```

```json
{
  "id": "10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa",
  "inventoryNumber": "INV-000123",
  "name": "Ноутбук Lenovo ThinkPad",
  "serialNumber": "SN-ABC-12345",
  "locationId": 1,
  "statusId": 1,
  "typeId": 2,
  "createdAt": "2026-03-26T11:00:00.000Z",
  "updatedAt": "2026-03-26T11:00:00.000Z"
}
```

### 4) Инвентаризации: create + close

```http
POST /inventories
Authorization: Bearer <accessToken>
```

```json
{
  "id": "5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74",
  "startedAt": "2026-03-26T12:00:00.000Z",
  "finishedAt": null,
  "createdBy": "10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa",
  "status": "OPEN"
}
```

```http
PATCH /inventories/5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74/close
Authorization: Bearer <accessToken>
```

```json
{
  "id": "5b8f0b5f-a8f9-4cdb-a9d3-8d3137d8ce74",
  "startedAt": "2026-03-26T12:00:00.000Z",
  "finishedAt": "2026-03-26T13:30:00.000Z",
  "createdBy": "10a5f06f-c4d8-4f42-9f35-97bc5b1f68aa",
  "status": "CLOSED"
}
```

## Валидация

Валидация включена глобально через `ValidationPipe` в `main.ts`:

- `whitelist: true` (лишние поля удаляются)
- `forbidNonWhitelisted: true` (неразрешенные поля приводят к ошибке)
- ошибки DTO отдаются как `422 Unprocessable Entity`

Основные правила в DTO:

- Auth:
- `login.email`: обязательный, валидный email, приводится к lowercase
- `login.password`: обязательный, `minLength = 8`
- `refresh.refreshToken`: обязательный непустой string

- Users:
- `create.email`: обязательный email
- `create.password`: обязательный string, `minLength = 8`
- `create.fullName`: обязательный string
- `create.roleId`: обязательный integer
- `update.fullName`: optional, непустой string
- `update.roleId`: optional integer
- `update.password`: optional string, `minLength = 8`

- Equipment:
- `inventoryNumber`: обязательный string, trim, `maxLength = 100`
- `name`: обязательный string, trim, `maxLength = 255`
- `serialNumber`: optional string, trim, `maxLength = 100`
- `locationId/statusId/typeId`: integer (`locationId` optional)

- Equipment query (`GET /equipment`):
- `page`: integer, `min = 1` (по умолчанию 1)
- `limit`: integer, `min = 1`, `max = 100` (по умолчанию 20)
- `statusId/typeId/locationId`: optional integer, `min = 1`
- `search`: optional string, trim

- Locations:
- `name`: string, обязательный (create), optional (update), `maxLength = 255`

- Equipment types:
- `name`: string, обязательный (create), optional (update), `maxLength = 100`

- Equipment statuses:
- `name`: string, обязательный (create), optional (update), `maxLength = 50`

- Inventory records:
- `create.inventoryId`: обязательный UUID
- `create.equipmentId`: обязательный UUID
- `create.comment`: optional string, trim, непустой если передан
- `update.comment`: optional string, `maxLength = 2000`
- `update.resultStatus`: optional, только `FOUND` или `DAMAGED`

## Обработка ошибок

Все ошибки возвращаются в едином формате:

{ "error": { "message": "<описание>" "error": "действие" "statusCode": <число>,} }

### Примеры ошибок

401 - Не авторизован (типичный ответ guard):

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

В `AuthService` есть явные `UnauthorizedException` с текстами:

- `Неверный email или пароль` (login)
- `Невалидный refresh-токен` (refresh)
- `Сессия устарела, выполните вход заново` (refresh)
- `Refresh-токен не найден или устарел` (refresh)
- `Пользователь заблокирован` (refresh)
- `Отсутствует access-токен` (logout)
- `Невалидный access-токен` (logout)

```json
{
    "message": "Неверный email или пароль",
    "error": "Unauthorized",
    "statusCode": 401
}
```

403 - Доступ запрещен (например, guard):

```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

404 - Не найден route:

```json
{
  "message": "Cannot GET /usersss",
  "error": "Not Found",
  "statusCode": 404
}
```

500 - Внутренняя ошибка сервера:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

422 - Ошибка валидации (global `ValidationPipe`):

```json
{
  "statusCode": 422,
  "message": "Данные запроса не прошли валидацию",
  "error": "Unprocessable Entity",
  "details": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

Ниже примеры сообщений, которые выбрасываются в сервисах напрямую.

404 - Примеры:

```json
{
  "statusCode": 404,
  "message": "Инвентаризация не найдена",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Оборудование не найдено",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 404,
  "message": "Запись инвентаризации не найдена",
  "error": "Not Found"
}
```

409 - Примеры:

```json
{
  "statusCode": 409,
  "message": "Инвентаризация уже закрыта",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Сначала закройте текущую инвентаризацию перед созданием новой",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Для этого оборудования уже есть запись в данной инвентаризации",
  "error": "Conflict"
}
```

```json
{
  "statusCode": 409,
  "message": "Нельзя изменять записи закрытой инвентаризации",
  "error": "Conflict"
}
```
