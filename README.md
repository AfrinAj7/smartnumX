# SmartNum

SmartNum is a single Next.js App Router application. Public, learner, and admin routes share one deployment; backend business rules live in server-only services.

## Local Setup

Requirements: Node.js 20+ and PostgreSQL 15+.

```powershell
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL`, a random `NEXTAUTH_SECRET`, and `SEED_ADMIN_PASSWORD` in `.env`. The seed password must be at least 12 characters. Configure `RESEND_API_KEY` and `EMAIL_FROM` for email verification and password recovery. Google sign-in is enabled only when both Google OAuth credentials are set.

Then run:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The seed creates `admin@example.com` as a Super Admin unless `SEED_ADMIN_EMAIL` is changed. Its first successful sign-in requires a password change. Sample learner/instructor accounts have no password unless `SEED_SAMPLE_PASSWORD` is set. Seed courses and announcements are labeled as sample data; courses remain drafts.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for folder responsibilities and [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for delivery phases.