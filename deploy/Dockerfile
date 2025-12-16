# Base image
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Build stage - install deps and build the app
FROM base AS builder

# Copy package files and prisma config
COPY package.json bun.lock ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .

# Generate Prisma client
RUN bun run prisma generate && echo 'export * from "./client";' > generated/prisma/index.ts

# Build the application
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Migrator image - minimal, only prisma CLI for migrations
FROM base AS migrator

ENV NODE_ENV=production

# Create non-root user
RUN adduser --system --uid 1001 migrator

WORKDIR /app

# Copy prisma files
COPY --from=builder --chown=migrator:bun /app/prisma ./prisma
COPY --from=builder --chown=migrator:bun /app/prisma.config.ts ./
COPY --from=builder --chown=migrator:bun /app/generated ./generated

# Install prisma + dotenv (required by prisma.config.ts)
RUN bun add prisma dotenv && rm -rf ~/.bun/install/cache

USER migrator

CMD ["bunx", "prisma", "migrate", "deploy"]

# Runner image - lean, no prisma CLI
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Set correct permission for prerender cache
RUN mkdir -p .next && chown nextjs:bun .next

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:bun /app/.next/standalone ./
COPY --from=builder --chown=nextjs:bun /app/.next/static ./.next/static

# Copy generated Prisma client (Prisma 7 - lightweight, no binary engines)
COPY --from=builder --chown=nextjs:bun /app/generated ./generated

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
