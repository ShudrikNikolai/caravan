FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable

# --------------------
# Dependencies
# --------------------
FROM base AS deps

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# --------------------
# Build
# --------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# --------------------
# Production
# --------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
