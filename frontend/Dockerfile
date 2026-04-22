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

# ---- runner stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# accepts version argument to override package.json version
ARG VERSION=""

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# update package.json version if VERSION arg is provided
RUN if [ -n "$VERSION" ]; then \
  node -e "const pkg = require('./package.json'); pkg.version = '$VERSION'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2))"; \
fi

EXPOSE 3000

CMD ["sh", "-c", "pnpm build && pnpm start"]
