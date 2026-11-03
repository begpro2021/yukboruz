# YUKBOR

YUKBOR is being migrated from a single-file HTML demo to a React + TypeScript web app with an Express API and PostgreSQL.

## MVP

- Phone/password accounts and the shipper, driver, fleet, and dispatcher roles
- Cargo and truck listings with search/filtering
- Auction bids, accepted bids, and trip status

Live GPS, Telegram OTP, KYC/OneID/Soliq, payments/Escrow, chat, and E-TTN/E-IMZO are not connected in this MVP. Seed records are synthetic demo data.

## Requirements

- Node.js 20+
- Docker Desktop (or a local PostgreSQL 16 instance)

## Local setup

1. Copy `.env.example` to `.env`. Use a unique random `SESSION_SECRET` of at least 32 characters.
2. Start PostgreSQL: `docker compose up -d db`
3. Install packages: `npm install`
4. Generate Prisma Client and run migrations: `npm run db:generate` then `npm run db:migrate`
5. Add synthetic demo records: `npm run db:seed`
6. Start the API and frontend: `npm run dev`

The web app is at `http://localhost:5173`; the API health check is `http://localhost:4000/api/v1/health`.

Development demo accounts (created only by the seed command):

| Role | Phone | Password |
|---|---|---|
| Yuk egasi | +998900000001 | Demo1234! |
| Haydovchi | +998900000002 | Demo1234! |
| Avtopark | +998900000003 | Demo1234! |
| Dispetcher | +998900000004 | Demo1234! |

These are local-only demonstration accounts. Do not use the seed password or sample profile data in production.

## Scripts

- `npm run dev` — starts both workspaces
- `npm run build` — builds API and frontend
- `npm run lint` — type-checks both workspaces
- `npm run test` — runs workspace tests
- `npm run db:migrate` / `npm run db:seed` — database setup

## Security

Never put bot tokens, database credentials, or other secrets in frontend code. The Telegram bot token previously embedded in the HTML prototype must be revoked/rotated before any Telegram integration is enabled. Configure production secrets outside the repository.
