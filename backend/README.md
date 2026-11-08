# Caravan Backend

NestJS API for the Caravan multiplayer card game. It owns authentication, rooms, the game engine, statistics, friends, presence, and the Socket.IO gateways.

## Stack

- NestJS 11
- TypeORM + PostgreSQL
- Redis
- Socket.IO
- Passport JWT
- Zod (`nestjs-zod`)
- pino (`nestjs-pino`)
- Swagger
- Terminus health checks
- Prometheus metrics

## Structure

```text
src/
  common/          base entities/repositories, filters, guards, interceptors, contracts
  config/          typed configuration (app, auth, database, game, logger, redis, swagger)
  infrastructure/  database, migrations, Redis, logger, metrics
  modules/
    auth/          login, registration, tokens, sessions
    user/          profile, user lookup, search
    caravan/       rooms, game engine, game state, history
    stats/         aggregates and recent games
    friends/       friendships, presence, challenges
    health/        health endpoints
```

Feature modules follow the same shape: `controller | gateway | module` plus only the folders they need (`consts/`, `decorators/`, `domain/`, `entities/`, `guards/`, `interfaces/`, `repositories/`, `schemas/`, `services/`, `usecases/`, `strategies/`).

## Quick start

Requirements: Node.js 22+, Yarn, PostgreSQL, Redis.

```bash
cd backend
yarn install

# create backend/.env (see Environment below)
yarn migration:run
yarn start:dev
```

The API starts on `http://localhost:3000` by default.

For local infrastructure without Docker Compose for the app:

```bash
# from the repository root
task docker:dev
```

## Environment

Local development reads `backend/.env`. Docker Compose reads `platform/config/.env.backend`.

Required variables:

### App

```text
APP_PORT
APP_NAME
NODE_ENV                 development | production | test
APP_BASE_URL
ALLOWED_ORIGIN           allowed HTTP origin
CORS_ORIGIN              comma-separated Socket.IO origins
APP_GLOBAL_DEFAULT_API_VERSION
APP_GLOBAL_PREFIX
APP_LOCALE
TZ
```

`CORS_ORIGIN` is read by the Socket.IO gateways. Set it explicitly in production; do not rely on the permissive fallback.

### Database

```text
DB_TYPE                  postgres
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_DATABASE
DB_SYNCHRONIZE           must be false; migrations are used
```

### Redis

```text
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
REDIS_DATABASE
```

### Auth

```text
JWT_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_TTL           seconds
JWT_REFRESH_TTL          seconds
SESSION_SECRET
SESSION_TTL              seconds
SESSION_ENABLED
```

### Swagger / logger / game

```text
SWAGGER_ENABLE
SWAGGER_PATH
LOGGER_LEVEL             trace | debug | info | warn | error | fatal | silent
LOGGER_FORMAT
GAME_FORFEIT_TIMEOUT_MS  optional, default 30000
```

Never commit `.env` files or secrets.

## Scripts

| Script | Description |
| --- | --- |
| `yarn start:dev` | Start with watch mode |
| `yarn start:debug` | Start with debugger and watch mode |
| `yarn build` | Compile and typecheck |
| `yarn start:prod` | Run compiled `dist/main` |
| `yarn lint` | ESLint with `--fix` |
| `yarn format` | Prettier |
| `yarn test` | Unit tests |
| `yarn test:watch` | Jest watch mode |
| `yarn test:cov` | Coverage |
| `yarn test:e2e` | E2E tests |
| `yarn migration:generate -- src/infrastructure/database/migrations/Name` | Generate a migration |
| `yarn migration:run` | Apply migrations |
| `yarn migration:revert` | Revert the last migration |
| `yarn migration:run:prod` | Apply migrations against compiled `dist/` |
| `yarn stats:backfill` | Rebuild statistics from existing `game_histories` |

Run a single test:

```bash
yarn test -- modules/caravan/domain/rules.spec.ts
```

## Database

- `synchronize` is disabled.
- Schema changes require a new migration; existing migrations are immutable.
- New entities must be registered in both `TypeOrmModule.forFeature` and `src/infrastructure/database/data-source.ts`.
- Active rooms/games live in Redis; PostgreSQL stores users, devices, refresh tokens, game history, statistics, and friendships.

Apply migrations inside the production Docker stack:

```bash
# repository root
task db:migrate
```

## Authentication

- JWT access and refresh tokens are stored in httpOnly cookies.
- Cookies are `sameSite: strict` and `secure` in production.
- HTTP JWT is read from `Authorization: Bearer` or the `access_token` cookie.
- WebSocket authentication reads the `access_token` cookie during the handshake.
- Refresh tokens rotate; logout and password change revoke active refresh tokens.
- Routes are protected globally by `JwtAuthGuard`; use `@Public()` to opt out.
- Auth DTOs use `createZodDto`; credentials are accepted only in POST bodies.
- Sensitive query parameters are redacted from responses and logs.

## HTTP API

Global prefix and URI versioning produce `/api/v1`.

### Auth

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
PATCH  /api/v1/auth/password/change
GET    /api/v1/auth/sessions
GET    /api/v1/auth/me
```

### Users

```text
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/search?q=
GET    /api/v1/users/:id
```

### Caravan

```text
POST   /api/v1/caravan/rooms
GET    /api/v1/caravan/rooms/public?page=&limit=
GET    /api/v1/caravan/rooms/:roomId
POST   /api/v1/caravan/rooms/:roomId/join
POST   /api/v1/caravan/rooms/:roomId/start
GET    /api/v1/caravan/me
POST   /api/v1/caravan/me/leave
```

### Stats

```text
GET    /api/v1/stats/me
GET    /api/v1/stats/:userId
GET    /api/v1/stats/me/games?page=&limit=
```

### Friends

```text
GET    /api/v1/friends
GET    /api/v1/friends/requests/incoming
GET    /api/v1/friends/requests/outgoing
POST   /api/v1/friends/requests
POST   /api/v1/friends/requests/:id/accept
POST   /api/v1/friends/requests/:id/decline
DELETE /api/v1/friends/:userId
POST   /api/v1/friends/:userId/challenge
POST   /api/v1/friends/challenges/:roomId/accept
POST   /api/v1/friends/challenges/:roomId/decline
```

### Health

```text
GET    /api/v1/health/ping
GET    /api/v1/health/network
```

Swagger is served at `SWAGGER_PATH` when `SWAGGER_ENABLE=true`.

## WebSocket

### Game namespace: `/caravan`

Client → server:

```text
game_event       play_number_card | play_face_card | discard_card | end_turn
lobby_subscribe
lobby_unsubscribe
```

Server → client:

```text
game_state
game_error
room:created
room:updated
room:removed
```

Game state is sent per player; opponent hands are redacted. A disconnect starts a forfeit grace period; reconnecting cancels it.

### Friends namespace: `/friends`

Server → client:

```text
friend:online
friend:offline
friend:request
friend:request:accepted
challenge:received
challenge:resolved
```

Presence is stored in Redis sets keyed by `presence:user:<userId>`.

## Game state and storage

Redis is used for active state:

- `room:*`, `room:by-user:*` — rooms
- `lobby:public` — public waiting-room index
- `room:lock:*` — atomic join lock
- `game:*`, `game:by-user:*` — active games
- `game:forfeits` — disconnect deadlines
- `game:finish-lock:*` — idempotent finish lock
- `session:*`, `user:sessions:*`, `black::*` — auth sessions
- `presence:user:*` — online sockets

Finished games are stored in `game_histories` with `result_reason` and `duration_seconds`.

## Statistics

- `stats` listens for `GAME_FINISHED_EVENT`.
- Aggregates are stored in `user_stats`.
- `stats_processed_games.game_id` makes processing idempotent.
- Forfeit/disconnect counts as a loss for the leaving player and a win for the opponent.
- Existing history can be reprocessed with `yarn stats:backfill`.

## Testing

```bash
yarn test
yarn test -- modules/caravan/domain/rules.spec.ts
yarn test:e2e
```

Domain logic is covered with colocated `*.spec.ts` files. Tests do not require the app to be running; e2e tests may require PostgreSQL and Redis.

## Docker

```bash
docker build -t caravan-backend ./backend
docker run --env-file ./platform/config/.env.backend -p 3000:3000 caravan-backend
```

Production migrations run through `yarn migration:run:prod` in the container (`task db:migrate`).
