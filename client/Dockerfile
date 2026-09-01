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

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# --------------------
# Production
# --------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
