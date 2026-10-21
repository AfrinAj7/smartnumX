# Application Architecture

This repository is a single Next.js application (App Router) for **SmartNum**. The `/admin` experience is a role-protected route inside this app, providing Super Admin and Instructor management capabilities.

```text
src/
  app/                 Next.js route entrypoints, layouts, and API handlers
  web-client/          Shared frontend components and client-facing views (Landing, Catalog, Layouts)
  admin/               Admin-panel-specific views and components (Site Content Editor, Dashboard)
  server/              Server-only business services and repositories (Leads, Site Content, Media, Auth)
  lib/                 Infrastructure adapters shared by route handlers/services (RBAC, Auth.js, S3, Prisma)
  types/               Shared TypeScript augmentations and domain types
prisma/                Database schema and seed/migration files
docs/                  Product, phase, architecture documentation, and changelog
```

## Architecture Boundaries

- `src/app` owns URL routing and delegates UI rendering to `src/web-client` or `src/admin`.
- `src/web-client` owns reusable public landing pages, account management, and learner UI; it does not import server services directly.
- `src/admin` owns Super Admin and instructor panel views. Route protection is enforced via `src/app/(admin)/admin/layout.tsx` and route-specific guards.
- `src/server` owns business rules and domain services. Route handlers validate input via Zod and call these services.
- `src/lib` owns infrastructure adapters such as Auth.js, Prisma client, and S3 media storage presigners.

## Media Upload & S3 Storage Setup

Website content (hero images, curriculum graphics, tutor photos, and MP4 demo videos) can be uploaded directly via the Admin Panel at `/admin/site-content`.

### Presigned Upload Flow:
1. Admin user selects an image (JPEG/PNG/WebP/AVIF up to 8MB) or video (MP4 up to 150MB) in the Site Content Editor (`/admin/site-content`).
2. Client calls `POST /api/admin/media-upload` (guarded by `SUPER_ADMIN` role check).
3. Server generates an S3 presigned `PUT` URL using `@aws-sdk/s3-request-presigner`.
4. Client uploads the file directly to the S3 / Cloudflare R2 bucket.
5. The public CDN URL (`S3_PUBLIC_URL` or standard S3 endpoint) is stored in the Homepage content settings JSON.

### S3 Environment Variables:
```env
S3_BUCKET=smartnum-media
S3_REGION=ap-south-1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com # Optional (for R2 / MinIO)
S3_PUBLIC_URL=https://media.smartnum.in                     # Optional (for custom CDN)
```