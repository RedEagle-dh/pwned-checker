# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pwned Checker is a T3-stack web application for monitoring email addresses for data breaches using the Have I Been Pwned (HIBP) API v3. It runs scheduled scans and sends email notifications when new breaches are detected.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC v11
- **UI**: Shadcn with Base UI primitives, Tailwind CSS v4, Tabler icons
- **Scheduling**: node-cron (via Next.js instrumentation)
- **Email**: Resend

## Commands

```bash
bun dev              # Start dev server with Turbo
bun run build        # Production build
bun run typecheck    # TypeScript type checking
bun run check        # Biome lint check
bun run check:write  # Biome lint with auto-fix

# Database
bun run db:push      # Push schema to database (development)
bun run db:generate  # Create new migration
bun run db:migrate   # Apply migrations (production)
bun run db:studio    # Open Prisma Studio
```

## Architecture

### tRPC with SSR Prefetching Pattern

All pages follow this pattern for SSR with hydration:

1. **Server Component** (`page.tsx`): Prefetches data with `void api.xxx.prefetch()`
2. **Client Component** (`_components/xxx-client.tsx`): Uses `useSuspenseQuery` for guaranteed data
3. **Skeleton Component** (`_components/xxx-skeleton.tsx`): Loading fallback for Suspense

```tsx
// page.tsx (Server)
export default async function Page() {
  void api.example.list.prefetch();
  return (
    <HydrateClient>
      <Suspense fallback={<Skeleton />}>
        <Client />
      </Suspense>
    </HydrateClient>
  );
}

// _components/xxx-client.tsx (Client)
"use client";
export function Client() {
  const [data] = api.example.list.useSuspenseQuery();
  // data is guaranteed, no loading/undefined checks needed
}
```

### Key Directories

- `src/server/api/routers/` - tRPC routers (email, breach, notification, scan)
- `src/server/services/` - Business logic (HIBP client, scanner, email sender)
- `src/cron/scheduler.ts` - Cron job definitions (initialized via `instrumentation.ts`)
- `src/components/ui/` - Shadcn components (excluded from Biome linting)

### HIBP API Integration

- Rate limit: **10 requests/minute** (6-second delay between requests)
- Requires `hibp-api-key` and `user-agent` headers
- Client in `src/server/services/hibp.ts`
- Scanner handles rate limiting and retries in `src/server/services/scanner.ts`

### Email Notification Tracking

The `Breach` model has an `emailSentAt` field to prevent duplicate notifications. The scanner:
1. Creates breach records without `emailSentAt`
2. Only sets `emailSentAt` after successful email delivery
3. Retries failed emails on subsequent scans

### Cron Schedule

- Daily scan: 6:00 AM every day
- Weekly scan: 6:00 AM every Monday
- Monthly scan: 6:00 AM on 1st of month

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `HIBP_API_KEY` - Have I Been Pwned API key
- `RESEND_API_KEY` - Resend email service API key
- `NOTIFICATION_EMAIL` - Email address for breach alerts

## Development Setup

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies and generate Prisma client
bun install

# Push schema to database
bun run db:push

# Start dev server
bun dev
```
