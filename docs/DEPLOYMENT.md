# JewelleryOS · Deployment & Operations Guide

> **Production Deployment Specification for Vercel, Managed PostgreSQL, and Progressive Web App**

---

## 1. Hosting Architecture Overview

```
                        +----------------------------+
                        |      CUSTOM DOMAIN         |
                        |   sandhyajewellers.com     |
                        +----------------------------+
                                      |
                                      v
                        +----------------------------+
                        |      VERCEL EDGE / CDN     |
                        |  - Next.js 16 (App Router) |
                        |  - HTTPS / SSL Certificate |
                        |  - Serverless Actions      |
                        +----------------------------+
                                      |
                    +-----------------+-----------------+
                    |                                   |
                    v                                   v
+---------------------------------------+   +-----------------------+
|          MANAGED POSTGRESQL           |   |     OBJECT STORAGE    |
|   Neon Serverless / Supabase Pg       |   |   Cloudinary / S3     |
|   - Connection Pooling (PgBouncer)    |   |   - Jewellery Photos  |
|   - Daily Automated Snapshots         |   |   - KYC Documents     |
|   - Point-in-time Recovery (PITR)     |   +-----------------------+
+---------------------------------------+
```

---

## 2. Environment Variables Configuration

The following variables must be configured in `.env.local` for local development and in the **Vercel Project Dashboard** (`Settings -> Environment Variables`):

```bash
# ==========================================
# DATABASE (PostgreSQL)
# ==========================================
# Pooled connection string (used by Next.js serverless functions)
DATABASE_URL="postgresql://user:password@ep-cool-pooler.neon.tech/jewellery_os?sslmode=require&pgbouncer=true"

# Direct connection string (used by Prisma CLI for migrations)
DIRECT_URL="postgresql://user:password@ep-cool.neon.tech/jewellery_os?sslmode=require"

# ==========================================
# AUTHENTICATION & SECURITY
# ==========================================
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://jeweller-os.vercel.app"

# ==========================================
# APPLICATION PRESETS
# ==========================================
NEXT_PUBLIC_DEFAULT_TENANT="tenant-sandhya-jaipur"
NEXT_PUBLIC_APP_NAME="JewelleryOS"
```

---

## 3. Database Migration Workflow

When modifying the Prisma schema:

```bash
# 1. Create and apply migration locally
npx prisma migrate dev --name init_erp_schema

# 2. Generate updated Prisma Client types
npx prisma generate

# 3. For CI / Production Vercel Deployment
npx prisma migrate deploy
```

---

## 4. Progressive Web App (PWA) Setup

To allow showroom staff and owners to install JewelleryOS onto their Windows PC or mobile home screens:
* **Manifest (`public/manifest.json`)**: Configured with `display: standalone`, shop branding colors (`#08090C` background, `#C5A059` gold accent), and high-resolution icons.
* **Service Worker**: Caches the application shell to ensure instantaneous load times even during unstable showroom Wi-Fi.

---

## 5. Automated Backup & Disaster Recovery Strategy

1. **Daily Automated Snapshots**: Neon / Supabase takes daily point-in-time backups retained for at least 30 days.
2. **Weekly Local Air-Gapped Dump**:
   ```bash
   pg_dump -Fc -v -d "$DATABASE_URL" -f "backups/jewellery_os_backup_$(date +%Y%m%d).dump"
   ```
3. **Recovery Verification Rule**: A backup is only valid if test restored periodically to a staging database.
