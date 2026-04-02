FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# ---- deps stage ----
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

# ---- build stage ----
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ---- runner stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN pnpm add -g pm2

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["pm2-runtime", "start", "pnpm", "--name", "cdk", "--max-memory-restart", "200M", "--restart-delay", "3000", "--max-restarts", "3", "--time", "--", "start"]
