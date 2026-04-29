# ---- base stage ----
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

# ---- build stage ----
FROM base AS builder

ENV NODE_ENV=production
ENV NEXT_PUBLIC_FRONTEND_BASE_URL=__NEXT_PUBLIC_FRONTEND_BASE_URL__
ENV NEXT_PUBLIC_BACKEND_BASE_URL=__NEXT_PUBLIC_BACKEND_BASE_URL__
ENV NEXT_PUBLIC_HCAPTCHA_SITE_KEY=__NEXT_PUBLIC_HCAPTCHA_SITE_KEY__
ENV HCAPTCHA_SECRET_KEY=__HCAPTCHA_SECRET_KEY__

ARG VERSION=""
ARG BUILD_DATE=""

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN if [ -n "$VERSION" ] || [ -n "$BUILD_DATE" ]; then \
  VERSION="$VERSION" BUILD_DATE="$BUILD_DATE" node -e "const fs = require('fs'); const pkg = require('./package.json'); const version = process.env.VERSION; const buildDate = process.env.BUILD_DATE; if (version) pkg.version = version; if (buildDate) pkg.buildDate = buildDate; fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\\n')"; \
fi

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ---- runner stage ----
FROM base AS runner

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["pnpm", "start"]
