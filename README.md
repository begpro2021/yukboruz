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

## Free hosted preview (Vercel + Render + Neon)

The repository includes a Vercel config for the React client and a Render Blueprint for the Express API. The Vercel app proxies `/api/*` to `https://yukbor-api.onrender.com`; this keeps the browser API and session cookie same-origin. If Render assigns a different service hostname, update the API rewrite destination in `vercel.json` to match it.

1. Create your own Vercel, Render, and Neon accounts. Import the GitHub repository into Vercel, choose Vercel's Hobby plan for an eligible personal project, set the repository root as the project root, and deploy once to get the production HTTPS origin.
2. In Neon, create a PostgreSQL project and copy its pooled connection string. Keep the connection string private; do not put it in Vercel settings or source files.
3. In Render, create a Blueprint from this repository and deploy `render.yaml` using the Free web service. Set the prompted `DATABASE_URL` to the Neon connection string and `CLIENT_ORIGIN` to the exact Vercel HTTPS origin (for example, `https://your-project.vercel.app`, with no trailing slash). Render generates `SESSION_SECRET` for the service. The start command applies committed Prisma migrations before starting the API.
4. `vercel.json` builds `client/dist`, routes the React SPA, and proxies API requests to `https://yukbor-api.onrender.com`; no API secret is needed in Vercel. If Render assigns a different service hostname, update this rewrite destination and redeploy Vercel.
5. After configuring the exact Vercel origin in Render, check `https://yukbor-api.onrender.com/api/v1/health` and redeploy the API if needed. Open the Vercel URL to use the app.

Free instances are suitable for demos, not production. Render spins a free web service down after 15 minutes without inbound traffic; its next request can take about a minute while it wakes. Neon Free suspends idle compute after about 5 minutes and wakes it on the next database request. The first login or API request after idle may therefore be slow or time out and need retrying. Free-plan limits can change; consult the providers' current terms. Do not use demo seed accounts or synthetic data as production data.

References: [Render free services](https://render.com/docs/free), [Neon pricing](https://neon.com/pricing), [Vercel Hobby plan](https://vercel.com/docs/plans/hobby).

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
