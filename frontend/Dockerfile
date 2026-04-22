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

# accepts build date argument to set package.json build metadata
ARG BUILD_DATE=""

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# update package.json build metadata when build args are provided
RUN if [ -n "$VERSION" ] || [ -n "$BUILD_DATE" ]; then \
  VERSION="$VERSION" BUILD_DATE="$BUILD_DATE" node -e "const fs = require('fs'); const pkg = require('./package.json'); const version = process.env.VERSION; const buildDate = process.env.BUILD_DATE; if (version) pkg.version = version; if (buildDate) pkg.buildDate = buildDate; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\\n')"; \
fi

EXPOSE 3000

CMD ["sh", "-c", "pnpm build && pnpm start"]
