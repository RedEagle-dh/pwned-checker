# Use Alpine for smaller base image
FROM oven/bun:1.3-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bun run prisma generate

# Build the application
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

# Production dependencies only
FROM base AS prod-deps
WORKDIR /app
COPY package.json bun.lockb* ./
COPY prisma ./prisma/
RUN bun install --frozen-lockfile --production && \
    bun run prisma generate

# Production image - use alpine for shell support (entrypoint)
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 -G nodejs nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy only the generated Prisma client (not all node_modules)
COPY --from=prod-deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prod-deps /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=prod-deps /app/generated ./generated

# Copy entrypoint script
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
