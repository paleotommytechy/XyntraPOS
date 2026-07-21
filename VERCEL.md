# Vercel Deployment Guide for XyntraPOS

This project is fully configured for deployment on **Vercel**.

---

## ⚡ Quick Deployment Steps

### Option A: Import via Vercel Dashboard (Recommended)

1. Push your latest code changes to **GitHub** / **GitLab** / **Bitbucket**.
2. Go to your [Vercel Dashboard](https://vercel.com/new) and click **"Add New..." > "Project"**.
3. Select your **XyntraPOS** repository.
4. **Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `pnpm install`
5. **Environment Variables**: Add your environment variables (copied from `.env` / `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PAYSTACK_PUBLIC_KEY`
   - `VITE_CLOUDINARY_CLOUD_NAME` (Optional)
   - `VITE_CLOUDINARY_UPLOAD_PRESET` (Optional)
6. Click **Deploy**. Vercel will build all monorepo packages and deploy the web application.

---

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Run deployment from project root:
   ```bash
   vercel
   ```
3. For production deployment:
   ```bash
   vercel --prod
   ```

---

## ⚙️ Configuration Files Added

- [vercel.json](file:///c:/Users/Ifeoluwa/Desktop/Projects/XyntraPOS/vercel.json): Root configuration specifying build commands, output directory (`apps/web/dist`), and SPA route rewrites (`/*` -> `/index.html`).
- [apps/web/vercel.json](file:///c:/Users/Ifeoluwa/Desktop/Projects/XyntraPOS/apps/web/vercel.json): Sub-package SPA rewrite configuration for single-page routing.
