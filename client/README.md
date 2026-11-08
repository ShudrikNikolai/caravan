# Caravan Client

Next.js frontend for the Caravan multiplayer card game. It provides authentication, the game board, public rooms, player statistics, and friends/challenges.

## Stack

- Next.js 16 (App Router)
- React 19
- Zustand
- Socket.IO client
- HeroUI v3
- Tailwind 4
- react-hook-form + Zod

## Requirements

- Node.js 22+
- Yarn
- A running Caravan backend (default `http://localhost:3000`)

## Quick start

```bash
cd client
yarn install
yarn dev
```

Create `client/.env.local` if the backend is not on the default origin:

```text
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Next.js usually starts on `http://localhost:3001` when the backend already uses port `3000`.

## Routes

| Route | Description |
| --- | --- |
| `/` | Personal cabinet: profile, aggregate stats, recent games |
| `/login` | Login |
| `/register` | Registration |
| `/caravan` | Lobby and game board |
| `/caravan?room=<id>` | Join/wait for a specific room |
| `/games` | Public games list |
| `/friends` | Friends, requests, presence, challenges |

`/login` and `/register` are public; the other routes are protected by `proxy.ts` using the `access_token` cookie.

## Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Development server |
| `yarn build` | Production build and typecheck |
| `yarn start` | Start the production build |
| `yarn lint` | ESLint |
| `yarn lint:fix` | ESLint with autofix (TS + TSX) |
| `yarn format` | Prettier |
| `yarn test` | Vitest tests from `test/` |
| `yarn test:watch` | Vitest watch mode |

Before finishing a change run:

```bash
yarn test
yarn lint
yarn build
```

## Structure

```text
src/
  app/                 App Router routes
    caravan/           lobby, game board, route-private hooks/components
    games/             public rooms page and hook
    friends/           friends page, hook, sections
    login/
    register/          page + form components
  components/          shared UI and socket providers
  lib/
    api/               HTTP client, domain APIs, shared DTO types
    socket/            game/lobby/friends Socket.IO hooks
    caravan-socket.ts  public barrel for socket hooks
    security.ts        sensitive URL-query cleanup
    schemas.ts         client-side Zod schemas
  store/               Zustand stores (auth, friends)
  proxy.ts             Next 16 request proxy / route guard
test/                  Vitest tests
```

Files under `app/**/_components` and `app/**/_hooks` are route-private and are not routable.

## API layer

All HTTP requests go through `src/lib/api`.

- `http.ts` — base URL, envelope unwrapping, `ApiError`, pagination, single-flight refresh.
- `auth.ts` — login, register, logout, current user.
- `caravan.ts` — rooms, game state, leave.
- `stats.ts` — profile stats and recent games.
- `friends.ts` — friends, requests, challenges.
- `types.ts` — handwritten DTOs shared by the modules.

The API uses:

- `/api/v1` prefix;
- `credentials: 'include'`;
- response envelope `{ status, data, ... }`;
- one retry after `401` via `/auth/refresh`.

Do not add ad-hoc `fetch` calls in components.

## Authentication

- The backend sets httpOnly `access_token` and `refresh_token` cookies.
- Login/register forms submit credentials in a POST body with `method="post"`.
- `proxy.ts` redirects based on cookie presence; API 401s trigger a single-flight refresh.
- Auth forms and the global provider strip credentials accidentally leaked into the URL, and `proxy.ts` redirects such URLs to a clean path.

## Realtime

Socket usage goes through `lib/caravan-socket.ts` and `lib/socket/`.

- `/caravan` — game events, `game_state`, `game_error`, and public lobby events.
- `/friends` — online/offline presence and challenge notifications.
- Game sockets restore state after reconnect.
- The friends socket is kept open globally after login by `FriendsSocketProvider`.
- Incoming challenges are shown by `ChallengeNotification`.

## State

- `store/auth.store.ts` — current user, login/register/logout, session status.
- `store/friends.store.ts` — online friends, incoming challenge, realtime refresh version.

Use Zustand for global state and local component state for UI-only state.

## UI

- Use HeroUI v3 components and Tailwind utilities.
- Shared styles/components live in `src/components/ui.tsx`.
- Do not add another UI library.
- Next.js 16 and HeroUI v3 differ from older versions; verify against the installed versions.

## Docker

The app uses Next.js `output: 'standalone'`.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=<backend-url> -t caravan-frontend ./client
docker run --env-file ./platform/config/.env.frontend -p 3100:3000 caravan-frontend
```

`NEXT_PUBLIC_API_URL` is baked in at build time, so use the public backend URL for production builds.
