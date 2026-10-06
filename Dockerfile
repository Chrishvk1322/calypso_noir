# Imagen de producción de Calypso Noir (Next.js standalone + Payload).
# Producción: la construye GitHub Actions (.github/workflows/deploy.yml), se publica en ghcr.io y
# Coolify la despliega. Demo: docker compose -f docker-compose.demo.yml up -d --build
# Al arrancar, Payload aplica las migraciones pendientes (prodMigrations en payload.config.ts).

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependencias (pnpm fijado en package.json → packageManager) ---
FROM base AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Se incrustan en el build: URL pública y si se bloquea la indexación (demo).
ARG NEXT_PUBLIC_SERVER_URL
ARG DISALLOW_INDEXING=0
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL \
    DISALLOW_INDEXING=$DISALLOW_INDEXING
# El build no consulta la base (las páginas son dinámicas), pero Payload exige estas variables.
RUN PAYLOAD_SECRET=build-only DATABASE_URL=postgres://build:build@localhost:5432/build pnpm run build

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Carpeta de imágenes subidas (se monta como volumen).
RUN mkdir -p media .next/cache && chown -R nextjs:nodejs media .next
USER nextjs
EXPOSE 3000
# Responde 200 si la app está arriba y llega a la base (src/app/(frontend)/api/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3   CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1
CMD ["node", "server.js"]
