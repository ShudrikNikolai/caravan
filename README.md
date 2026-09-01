# Caravan

Caravan is a multiplayer card game with a NestJS backend and Next.js frontend.

## Cmd

- task docker:up:build
- task docker:up
- task docker:down
- task docker:logs
- task docker:logs:backend
- task docker:logs:frontend
- task docker:dev
- task docker:dev:down

## Stack

### Backend

- NestJS
- TypeORM
- PostgreSQL
- Redis
- Socket.IO
- JWT
- Zod

### Frontend

- Next.js
- React
- Zustand
- Socket.IO Client
- HeroUI

## Project structure

```text
caravan
├── backend
│   ├── src
│   │   ├── common
│   │   │   ├── contracts
│   │   │   │   └── user-contract.interface.ts
│   │   │   ├── decorators
│   │   │   │   └── api-response.decorator.ts
│   │   │   ├── entities
│   │   │   │   └── base.entity.ts
│   │   │   ├── filters
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── guards
│   │   │   │   └── base-auth.guard.ts
│   │   │   ├── interceptors
│   │   │   │   ├── composite.interceptor.ts
│   │   │   │   ├── timeout.interceptor.ts
│   │   │   │   └── transform.interceptor.ts
│   │   │   ├── interfaces
│   │   │   │   ├── api-response.interface.ts
│   │   │   │   └── repository.interface.ts
│   │   │   ├── repositories
│   │   │   │   ├── abstract-base.repository.ts
│   │   │   │   └── typeorm.repository.ts
│   │   │   └── utils
│   │   │       ├── const.util.ts
│   │   │       └── token-hash.util.ts
│   │   ├── config
│   │   │   ├── configs
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── auth.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── logger.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   └── swagger.config.ts
│   │   │   ├── config.module.ts
│   │   │   ├── config.service.ts
│   │   │   └── index.ts
│   │   ├── infrastructure
│   │   │   ├── database
│   │   │   │   ├── migrations
│   │   │   │   │   ├── 1756620000000-InitialSchema.ts
│   │   │   │   │   └── 1788253056780-CreateGameHistories.ts
│   │   │   │   ├── data-source.ts
│   │   │   │   ├── database.module.ts
│   │   │   │   └── database.service.ts
│   │   │   ├── logger
│   │   │   │   ├── logger.module.ts
│   │   │   │   └── logger.service.ts
│   │   │   ├── redis
│   │   │   │   ├── redis.module.ts
│   │   │   │   ├── redis.service.spec.ts
│   │   │   │   └── redis.service.ts
│   │   │   └── infra.module.ts
│   │   ├── modules
│   │   │   ├── auth
│   │   │   │   ├── consts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── decorators
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── public.decorator.ts
│   │   │   │   ├── entities
│   │   │   │   │   └── refresh-token.entity.ts
│   │   │   │   ├── guards
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── local-auth.guard.ts
│   │   │   │   │   └── refresh-token.guard.ts
│   │   │   │   ├── interfaces
│   │   │   │   │   ├── auth-request.interface.ts
│   │   │   │   │   ├── jwt-payload.interface.ts
│   │   │   │   │   ├── refresh-token.interface.ts
│   │   │   │   │   └── tokens.interface.ts
│   │   │   │   ├── repositories
│   │   │   │   │   └── refresh-token.repository.ts
│   │   │   │   ├── schemas
│   │   │   │   │   ├── login.schema.ts
│   │   │   │   │   ├── refresh-token.schema.ts
│   │   │   │   │   ├── register.schema.ts
│   │   │   │   │   └── reponse.schema.ts
│   │   │   │   ├── services
│   │   │   │   │   ├── auth.service.spec.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── external-user.service.ts
│   │   │   │   │   ├── session.service.spec.ts
│   │   │   │   │   └── session.service.ts
│   │   │   │   ├── strategies
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   └── refresh-token.strategy.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.module.ts
│   │   │   ├── caravan
│   │   │   │   ├── domain
│   │   │   │   │   ├── card.spec.ts
│   │   │   │   │   ├── card.ts
│   │   │   │   │   ├── dealer.spec.ts
│   │   │   │   │   ├── dealer.ts
│   │   │   │   │   ├── game-state.ts
│   │   │   │   │   ├── lane.spec.ts
│   │   │   │   │   ├── lane.ts
│   │   │   │   │   ├── rules.spec.ts
│   │   │   │   │   └── rules.ts
│   │   │   │   ├── entities
│   │   │   │   │   └── game-history.entity.ts
│   │   │   │   ├── guards
│   │   │   │   │   └── caravan-ws.guard.ts
│   │   │   │   ├── repositories
│   │   │   │   │   ├── game-history.repository.ts
│   │   │   │   │   └── game-state.repository.ts
│   │   │   │   ├── schemas
│   │   │   │   │   ├── game-events.schema.ts
│   │   │   │   │   ├── invite.schema.ts
│   │   │   │   │   ├── join-room.schema.ts
│   │   │   │   │   ├── play-card.schema.ts
│   │   │   │   │   └── ws-events.schema.ts
│   │   │   │   ├── services
│   │   │   │   │   ├── caravan.service.spec.ts
│   │   │   │   │   └── caravan.service.ts
│   │   │   │   ├── caravan.controller.ts
│   │   │   │   ├── caravan.gateway.ts
│   │   │   │   ├── caravan.module.ts
│   │   │   │   └── pkg.md
│   │   │   ├── health
│   │   │   │   ├── health.controller.ts
│   │   │   │   └── health.module.ts
│   │   │   └── user
│   │   │       ├── consts
│   │   │       │   └── index.ts
│   │   │       ├── entities
│   │   │       │   ├── device.entity.ts
│   │   │       │   └── user.entity.ts
│   │   │       ├── interfaces
│   │   │       │   └── user.interface.ts
│   │   │       ├── repositories
│   │   │       │   ├── device.repository.ts
│   │   │       │   └── user.repository.ts
│   │   │       ├── schemas
│   │   │       │   ├── create-user.schema.ts
│   │   │       │   ├── user-response.schema.ts
│   │   │       │   └── user-update.schema.ts
│   │   │       ├── services
│   │   │       │   ├── user-external.service.spec.ts
│   │   │       │   ├── user-external.service.ts
│   │   │       │   ├── user.service.spec.ts
│   │   │       │   └── user.service.ts
│   │   │       ├── user.controller.ts
│   │   │       └── user.module.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── swagger.ts
│   ├── test
│   │   ├── app.e2e-spec.ts
│   │   ├── auth.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── .dockerignore
│   ├── .env
│   ├── .env-example
│   ├── .gitignore
│   ├── .prettierignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── eslint.config.mjs
│   ├── nest-cli.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.build.json
│   ├── tsconfig.json
│   ├── tsconfig.migrations.json
│   └── yarn.lock
├── client
│   ├── public
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── src
│   │   ├── app
│   │   │   ├── caravan
│   │   │   │   └── page.tsx
│   │   │   ├── login
│   │   │   │   └── page.tsx
│   │   │   ├── register
│   │   │   │   └── page.tsx
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── providers.tsx
│   │   ├── components
│   │   │   └── theme-switcher.tsx
│   │   ├── lib
│   │   │   ├── api.ts
│   │   │   ├── caravan-socket.ts
│   │   │   └── schemas.ts
│   │   ├── store
│   │   │   └── auth.store.ts
│   │   └── proxy.ts
│   ├── test
│   │   └── index.ts
│   ├── .dockerignore
│   ├── .env-example
│   ├── .gitignore
│   ├── .prettierignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── tsconfig.json
│   └── yarn.lock
├── platform
│   ├── config
│   │   ├── .env.backend
│   │   └── .env.frontend
│   ├── docker-compose.dev.yml
│   └── docker-compose.yml
├── LICENSE
├── README.md
└── Taskfile.yaml
````

## Requirements

* Node.js 22+
* Yarn
* PostgreSQL
* Redis

## Docker

Build backend:

```bash
docker build -t caravan-backend ./backend
```

Build frontend:

```bash
docker build -t caravan-frontend ./frontend
```

Run backend:

```bash
docker run --env-file ./backend/.env -p 3000:3000 caravan-backend
```

Run frontend:

```bash
docker run --env-file ./frontend/.env -p 3100:3000 caravan-frontend
```
