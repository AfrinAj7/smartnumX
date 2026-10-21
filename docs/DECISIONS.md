# Decisions

## Initial foundation

- Follow the confirmed stack and role hierarchy in `AGENTS.md`; keep recorded courses as the v1 user experience and retain batch/session models for the feature-flagged later phase.
- Use Next.js 15 App Router, TypeScript, Prisma, PostgreSQL, and Tailwind CSS for the initial scaffold.
- Use Auth.js-compatible Prisma adapter models alongside the platform's account, role, and status fields.
- Keep `SEED_ADMIN_PASSWORD` environment-driven; never commit a working administrator credential.
- Keep the product as one Next.js deployment: `src/app` owns routes, `src/web-client` owns shared screens/components, `src/admin` owns admin views, and `src/server` owns business services.
- Store only hashes of email verification and password-reset tokens. Both are single-use and expire after 30 minutes.
- Send verification and reset emails through Resend's HTTPS API, avoiding an unnecessary SMTP package dependency; only the API key and verified sender are configured as environment variables.
- Lock a credential/IP pair for 15 minutes after five failed attempts in a 15-minute window. When the trusted client IP header is unavailable, the throttle key falls back to the email and a stable unknown-IP value.
- Sample course content remains draft and is clearly marked as sample data; sample login credentials are not created unless `SEED_SAMPLE_PASSWORD` is explicitly set.
- The public and portal brand is SmartNum. Any previous reference or copy from external templates has been removed. All identity, copy, results, and teacher data belong exclusively to SmartNum.
- Mathematics is the initial public positioning. Class range, boards, tutor credentials, programme prices, results, testimonials, address, phone, email, WhatsApp number, refund terms and scholarship details remain unconfirmed. Public copy keeps explicit placeholders and avoids outcome guarantees.
- SmartNum scale, concept-clarity percentages, educator counts, smart classrooms, batch sizes and centre facilities are not verified facts and must not be stated as real until the owner confirms them.
- The hero uses a clearly labelled representative classroom photo because no SmartNum centre/teacher image was supplied; replace it with approved SmartNum photography before launch.
- Record the demo request and consent before any future lead notification; do not describe the form as a booked lesson until a team member confirms it.