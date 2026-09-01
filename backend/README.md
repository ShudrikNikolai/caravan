
### Backend

```bash
cd backend

yarn install
yarn migration:run
yarn start:dev
```

Backend:

```text
http://localhost:3000
```

## Database migrations

Create migration:

```bash
yarn migration:create src/infrastructure/database/migrations/Name
```

Generate migration:

```bash
yarn migration:generate src/infrastructure/database/migrations/Name
```

Run migrations:

```bash
yarn migration:run
```

Rollback last migration:

```bash
yarn migration:revert
```

For production, use migrations instead of TypeORM `synchronize`.

## Authentication

Authentication uses JWT stored in HTTP-only cookies.

The frontend sends cookies with:

```ts
credentials: 'include'
```

WebSocket authentication uses the `access_token` cookie during the Socket.IO handshake.

## Game communication

HTTP is used for:

* creating rooms;
* joining rooms;
* starting games;
* loading the current game.

Socket.IO is used for:

* game events;
* game state updates;
* game errors.

Game state is stored in Redis.

## API

Main endpoints:

```text
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
GET  /api/v1/auth/me

POST /api/v1/caravan/rooms
GET  /api/v1/caravan/rooms/:roomId
POST /api/v1/caravan/rooms/:roomId/join
POST /api/v1/caravan/rooms/:roomId/start
GET  /api/v1/caravan/me
```

WebSocket namespace:

```text
/caravan
```

Main event:

```text
game_event
```

Server events:

```text
game_state
game_error
```

## Game flow

```text
Create room
     ↓
Share room ID
     ↓
Second player joins
     ↓
Room becomes ready
     ↓
Game starts
     ↓
Socket.IO connection
     ↓
Game events
     ↓
Game state updates
```
