# Build stage - install deps and build the app
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

# Copy package files and prisma config
COPY package.json bun.lockb* ./
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

# Production image
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

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

# Copy Prisma files for migrations
COPY --from=builder --chown=nextjs:bun /app/prisma ./prisma
COPY --from=builder --chown=nextjs:bun /app/prisma.config.ts ./

# Copy entrypoint script
COPY --chown=nextjs:bun deploy/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
