# Caravan

Caravan is a real-time multiplayer card game: a NestJS backend and a Next.js frontend, connected over HTTP and Socket.IO.

## Features

- Email/password authentication with httpOnly JWT cookies and refresh-token rotation.
- Two-player Caravan game with a server-authoritative game engine.
- Room creation, private invite rooms, and public room discovery.
- Automatic forfeit on explicit leave or after a disconnect grace period.
- Player statistics, win streaks, average game duration, and recent game history.
- Friends, incoming/outgoing requests, online presence, and challenge rooms.
- Public lobby and challenge notifications over WebSocket.

## Repository layout

| Path | Purpose |
| --- | --- |
| `backend/` | NestJS API, game engine, WebSocket gateways, PostgreSQL/Redis integration |
| `client/` | Next.js App Router application |
| `nginx/` | Reverse proxy configuration |
| `platform/` | Production/dev Docker Compose and monitoring configuration |
| `Taskfile.yaml` | Docker command shortcuts |
| `Roadmap.md` | Target architecture and planned work |
| `AGENTS.md` | Repository instructions for coding agents |

## Stack

### Backend

- NestJS 11, TypeORM, PostgreSQL
- Redis for active rooms, games, sessions, deadlines, and presence
- Socket.IO, Passport JWT, Zod (`nestjs-zod`)
- pino, Swagger, Terminus, Prometheus

### Frontend

- Next.js 16 (App Router), React 19
- Zustand, Socket.IO client
- HeroUI v3, Tailwind 4
- react-hook-form + Zod

## Requirements

- Node.js 22+
- Yarn
- PostgreSQL and Redis
- Docker + Task (for the Docker workflow)

## Quick start

### Docker

```bash
# Build and start the full stack (nginx, backend, frontend, Postgres, Redis)
task docker:up:build

# First run or after adding a migration: apply migrations
task db:migrate

task docker:logs
task docker:down
```

`task docker:up` starts the existing images and runs migrations automatically. `task docker:up:build` rebuilds images but does **not** run migrations.

The application is available through nginx at `http://localhost`. The backend is exposed internally on port `3000`; the frontend container is exposed through nginx.

### Local development

```bash
# Start only PostgreSQL and Redis
task docker:dev

# Backend
cd backend
yarn install
# create backend/.env (see backend/README.md)
yarn migration:run
yarn start:dev

# Client (second terminal)
cd client
yarn install
yarn dev
```

The backend runs on `http://localhost:3000`. Next.js usually starts on `http://localhost:3001`; set `NEXT_PUBLIC_API_URL=http://localhost:3000` if needed.

## Commands

### Docker / Taskfile

| Command | Description |
| --- | --- |
| `task docker:up` | Start the production stack and run migrations |
| `task docker:up:build` | Build and start the stack; migrations are not run |
| `task db:migrate` | Run migrations inside the backend container |
| `task docker:down` | Stop the stack |
| `task docker:down:volumes` | Stop the stack and remove volumes (destructive) |
| `task docker:dev` | Start Postgres + Redis for local development |
| `task docker:dev:down` | Stop local infrastructure |
| `task docker:logs` | Follow all logs |
| `task docker:logs:backend` | Follow backend logs |
| `task docker:logs:frontend` | Follow frontend logs |

### Backend

```bash
cd backend
yarn start:dev       # watch mode
yarn build           # compile + typecheck
yarn lint            # ESLint with --fix
yarn format          # Prettier
yarn test            # all unit tests
yarn test -- modules/caravan/domain/rules.spec.ts
yarn test:e2e        # e2e tests
yarn stats:backfill  # rebuild stats from game_histories
```

### Client

```bash
cd client
yarn dev
yarn build           # production build + typecheck
yarn start
yarn lint
yarn lint:fix
yarn format
yarn test            # Vitest
yarn test:watch      # Vitest watch mode
```

Client tests live in `client/test/` and use Vitest.

## Environment

- Local backend development reads `backend/.env`.
- Docker Compose reads `platform/config/.env.backend` and `platform/config/.env.frontend`.
- Env files are not committed. Required variables are listed in [backend/README.md](backend/README.md).
- Optional backend variable: `GAME_FORFEIT_TIMEOUT_MS` — disconnect grace period in milliseconds, default `30000`.
- Client variable: `NEXT_PUBLIC_API_URL` — backend origin, default `http://localhost:3000`.

## Database

Schema changes are applied only through TypeORM migrations; `synchronize` is disabled.

```bash
cd backend
yarn migration:generate -- src/infrastructure/database/migrations/MigrationName
yarn migration:run
yarn migration:revert
```

Existing migrations are immutable. Add a new migration instead of editing an applied one.

## API and realtime

The HTTP API is served under `/api/v1`. Swagger is enabled by `SWAGGER_ENABLE` and served at `SWAGGER_PATH`.

Main groups:

```text
/auth       login, register, refresh, logout, sessions, profile
/users      profile, user lookup, search
/caravan    rooms, join/start/leave, current game
/stats      own stats, stats by user, recent games
/friends    friends, requests, challenges
/health     health checks
```

### WebSocket

```text
/caravan   game events and state, public lobby updates
/friends    friend presence, requests, challenge notifications
```

Both gateways authenticate with the httpOnly `access_token` cookie sent during the Socket.IO handshake.

## Security notes

- JWT access/refresh tokens are stored in httpOnly cookies; do not store tokens in JS or `localStorage`.
- Credentials are sent only in POST request bodies, never in URLs or query strings.
- Auth forms use `method="post"`; accidentally leaked auth query params are stripped by the client and proxy.
- Sensitive query parameters are redacted from API responses and logs.
- Bearer authentication is also accepted by the HTTP JWT strategy for non-browser clients.

## Docker images

```bash
docker build -t caravan-backend ./backend
docker build --build-arg NEXT_PUBLIC_API_URL=<url> -t caravan-frontend ./client
docker run --env-file ./platform/config/.env.backend -p 3000:3000 caravan-backend
docker run --env-file ./platform/config/.env.frontend -p 3100:3000 caravan-frontend
```

The frontend uses Next.js `output: 'standalone'` and expects `NEXT_PUBLIC_API_URL` at build time.

## Documentation

- [Backend README](backend/README.md)
- [Client README](client/README.md)
