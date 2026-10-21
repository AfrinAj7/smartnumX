# Changelog

## Unreleased

- Started Phase 1 with a Next.js App Router and TypeScript scaffold.
- Added the initial PostgreSQL/Prisma domain schema and shared role-check helpers.
- Added baseline SmartNum brand tokens and implementation phase tracking.
- Added hashed email-verification and password-reset tokens, credential lockout, Auth.js credentials and optional Google sign-in, and Resend HTTPS mail delivery.
- Added sign-up, sign-in, verification, password recovery, first-login password change, and role-protected learner/admin workspace routes.
- Grouped shared UI under `src/web-client`, admin views under `src/admin`, and kept business services under `src/server`.
- Added repeatable environment-driven sample seed data and architecture/setup documentation.
- Added five-attempt credential lockout tests, forced first-login password change, and server-side role/status refresh.
- Upgraded Vitest to the compatible patched release and pinned patched PostCSS; documented remaining upstream dependency advisories.
- Comprehensive SmartNum marketing landing page complete with sticky navigation, mathematics hero carousel, interactive Why SmartNum tabs/mobile accordion, programmes & curricula cards, YouTube facade video gallery, demo lead capture, FAQ accordion with JSON-LD schema, and dedicated Indirapuram Visit Us location block with Google Maps embed.
- Full SmartNum branding and contact integration: Indirapuram address (04224, ATS Advantage, Indirapuram, Ghaziabad, UP - 201014), phones (+91 99589 47774, +91 88004 05640), email (gosmartnum@gmail.com), WhatsApp, Instagram, Facebook, YouTube, and LinkedIn profiles.
- Admin Panel Site Content Editor (`/admin/site-content`) with S3 presigned upload support for hero images, curriculum images, tutor photos, and MP4 demo videos. S3 variables (`S3_ENDPOINT`, `S3_PUBLIC_URL`) documented in `.env.example` and `ARCHITECTURE.md`.