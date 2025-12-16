# Pwned Checker 🔐

A self-hosted web application to monitor your email addresses for data breaches using the [Have I Been Pwned](https://haveibeenpwned.com/) API. Get notified when your emails appear in new breaches.

[![CI/CD](https://github.com/redeagle-dh/pwned-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/redeagle-dh/pwned-checker/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![License](https://img.shields.io/badge/License-MIT-green)

<img src="https://github.com/RedEagle-dh/pwned-checker/blob/main/public/dashboard_screen.png" />

## Features

- Monitor multiple email addresses for data breaches
- Automatic scanning with configurable schedules (daily, weekly, monthly)
- Email notifications via [Resend](https://resend.com) when new breaches are detected
- Dashboard with breach statistics and scan history
- Smart rate limiting based on your HIBP subscription RPM
- Encrypted API key storage in database
- Dark mode support

## Tech Stack

- [Next.js 16](https://nextjs.org) - React framework with App Router
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Prisma](https://prisma.io) - Database ORM
- [PostgreSQL](https://postgresql.org) - Database
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Bun](https://bun.sh) - JavaScript runtime and package manager

## Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://docker.com) (for PostgreSQL, or use your own instance)
- [HIBP API Key](https://haveibeenpwned.com/API/Key) - Required for breach checking
- [Resend API Key](https://resend.com) - Required for email notifications

## Quick Start

1. Clone the repository:

    ```bash
    git clone https://github.com/redeagle-dh/pwned-checker.git
    cd pwned-checker
    ```

2. Install dependencies:

    ```bash
    bun install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and configure:

    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/pwned-checker"
    ENCRYPTION_KEY="your-64-character-hex-key"  # Generate with: openssl rand -hex 32
    ```

4. Start the database:

    ```bash
    docker compose up -d
    ```

5. Run database migrations:

    ```bash
    bun run db:generate
    ```

6. Start the development server:

    ```bash
    bun run dev
    ```

7. Open [http://localhost:3000](http://localhost:3000) and configure your API keys in Settings.

## Configuration

API keys can be configured in two ways:

1. Via the Settings page (recommended) - Keys are encrypted and stored in the database
2. Via environment variables - Set `HIBP_API_KEY`, `RESEND_API_KEY`, and `NOTIFICATION_EMAIL` in `.env`

### Environment Variables

| Variable             | Required | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | PostgreSQL connection string                                    |
| `ENCRYPTION_KEY`     | Yes      | 32-byte key for encrypting API keys (64 hex chars)              |
| `HIBP_API_KEY`       | No       | Have I Been Pwned API key (can be set in Settings)              |
| `RESEND_API_KEY`     | No       | Resend API key for email notifications (can be set in Settings) |
| `NOTIFICATION_EMAIL` | No       | Email address to receive breach alerts (can be set in Settings) |

## Docker Deployment

Pre-built images are available on GitHub Container Registry:

```bash
docker pull ghcr.io/redeagle-dh/pwned-checker:latest
```

The Docker image automatically runs database migrations on startup.

### Docker Compose (Production)

The `deploy/docker-compose.yml` uses environment variables for configuration:

```bash
# Required environment variables
export POSTGRES_PASSWORD="your-secure-password"
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# Optional (have defaults)
export POSTGRES_USER="postgres"
export POSTGRES_DB="pwned-checker"

# Start the stack
docker compose -f deploy/docker-compose.yml up -d
```

Or create a `.env` file in the `deploy/` folder:

```env
POSTGRES_PASSWORD=your-secure-password
ENCRYPTION_KEY=your-64-character-hex-key
```

### Building Locally

If you prefer to build the image yourself:

```bash
docker build -f deploy/Dockerfile -t pwned-checker .
```

## Development

Start the database using the development compose file (uses static credentials):

```bash
docker compose -f deploy/docker-compose.dev.yml up -d
```

Then run the development commands:

```bash
# Start dev server with hot reload
bun run dev

# Type checking
bun run typecheck

# Linting
bun run check

# Format and fix lint issues
bun run check:write

# Open Prisma Studio (database GUI)
bun run db:studio
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── _components/        # Page-specific components
│   ├── breaches/           # Breaches page
│   ├── emails/             # Emails management page
│   └── settings/           # Settings page
├── components/             # Shared UI components
├── server/
│   ├── api/                # tRPC routers
│   └── services/           # Business logic (HIBP, email, scanner)
├── cron/                   # Scheduled job definitions
└── trpc/                   # tRPC client configuration
```

## Scan Schedules

Configure scan schedules in the Settings page:

- Daily: Runs at specified hour
- Weekly: Runs on specified day and hour
- Monthly: Runs on specified date and hour

The scanner respects your HIBP subscription's rate limit (RPM) and automatically batches requests to avoid hitting limits.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- [Have I Been Pwned](https://haveibeenpwned.com/) by Troy Hunt
- [T3 Stack](https://create.t3.gg/) for the project foundation
- [Resend](https://resend.com) for email delivery
