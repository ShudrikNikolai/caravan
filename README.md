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
