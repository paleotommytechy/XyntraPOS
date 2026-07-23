# XyntraPOS — Deployment & Operations Guide

This guide details the step-by-step procedure for deploying **XyntraPOS** to production environments, managing Supabase backend infrastructure, executing zero-downtime database migrations, and configuring backup and recovery procedures.

---

## 1. Architecture Overview

- **Frontend Application**: Deployed on **Vercel** (Edge CDN + Static Web Application).
- **Backend Services**: **Supabase** (Managed PostgreSQL database, Auth, RLS engine, Realtime subscriptions, Edge Functions).
- **Payment Processing**: **Paystack** (Hosted popup & webhook callbacks).

---

## 2. Production Environment Provisioning

### Step 1: Supabase Project Setup
1. Create a new production project in Supabase Console.
2. Under **Project Settings -> Database**, copy the PostgreSQL connection strings.
3. Enable **Point-in-Time Recovery (PITR)** under Backup settings.
4. Run all Supabase database migrations in chronological order from `supabase/migrations/`:
   - `20260723010000_upgrade_staff_invitations_and_rls.sql`
   - `20260723020000_rbac_business_and_shift_policies.sql`
   - `20260723030000_add_tutorial_completion_flag.sql`

### Step 2: Vercel Frontend Deployment
1. Connect the GitHub repository `paleotommytechy/XyntraPOS` to Vercel.
2. Set the Root Directory to `./apps/web` or use default root with Vercel build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm --filter web build`
   - **Output Directory**: `dist`
3. Configure Environment Variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`: `https://<prod-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<production-anon-key>`
   - `VITE_PAYSTACK_PUBLIC_KEY`: `pk_live_xxx`
   - `VITE_SENTRY_DSN`: `https://<sentry-key>@sentry.io/<proj>`

---

## 3. Database Backup & Disaster Recovery

### Automated Backups
- **Daily Automated Backups**: Retained for 30 days automatically by Supabase managed service.
- **Point-In-Time Recovery (PITR)**: Enables granular restoration to any specific second within the last 7 days.

### Manual Backup Command
```bash
supabase db dump -p <db-password> -f xyntrapos_backup_$(date +%Y%m%d).sql
```

### Recovery Procedure
In the event of database degradation or severe failure:
1. Provision a replacement database instance or restore to PITR timestamp via Supabase Console.
2. Run database integrity verification checks.
3. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel production environment variables.
4. Trigger redeployment of the web application.

---

## 4. Zero-Downtime Migration Strategy

When releasing database schema updates:
1. **Backwards Compatible Changes**: Always add new columns as nullable or with default values.
2. **Phase 1**: Apply migration script to database.
3. **Phase 2**: Deploy updated frontend code consuming the new fields.
4. **Phase 3**: Run cleanup or deprecation scripts if replacing older schema fields.

---

## 5. Security & Secret Audit Checklist

Before launching production releases:
- [x] All Supabase database tables have `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`.
- [x] `service_role` secret key is NEVER exposed or bundled in client-side Vite builds.
- [x] `x-paystack-signature` is verified on all incoming payment webhooks using HMAC SHA-512.
- [x] CORS allowed origins are strictly configured to the production domain (`https://xyntrapos.com`).
