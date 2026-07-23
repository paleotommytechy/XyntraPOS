# XyntraPOS — Developer Guide

Welcome to the developer guide for **XyntraPOS**, a high-performance, modern cloud Point-of-Sale (POS) and inventory management platform.

---

## 1. Monorepo Architecture

XyntraPOS is organized as a `pnpm` monorepo:

```
XyntraPOS/
├── apps/
│   └── web/                   # Vite + React 19 + TypeScript POS Web Application
├── packages/
│   ├── types/                 # Shared TypeScript interfaces & Supabase database types
│   ├── ui/                    # Shared design system components (Button, Modal, Input, Table, etc.)
│   └── utils/                 # Core shared utilities (currency, date, validators, security)
├── docs/                      # Comprehensive platform documentation
├── supabase/                  # Database migrations, RLS policies, seed data
├── .github/workflows/         # CI/CD workflows
├── package.json               # Root monorepo configuration
└── pnpm-workspace.yaml        # Workspace configuration
```

---

## 2. Prerequisites & Setup

### Requirements
- **Node.js**: v20.x or higher
- **pnpm**: v9.x or higher (`corepack enable`)
- **Git**: Latest release
- **Supabase CLI** (optional for local migration testing)

### Initial Setup

1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone https://github.com/paleotommytechy/XyntraPOS.git
   cd XyntraPOS
   pnpm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` in the root workspace directory:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-instance.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxx
   ```

---

## 3. Development Workflow & Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Launch local development server (`http://localhost:5173`) |
| `pnpm build` | Build all workspace packages and apps in production mode |
| `pnpm lint` | Execute ESLint static analysis across all workspaces |
| `pnpm format` | Run Prettier formatter to auto-format code |
| `pnpm format:check` | Check code formatting compliance |
| `pnpm test` | Run Vitest unit & integration test suites |
| `pnpm test:coverage` | Generate code coverage metrics |
| `pnpm test:e2e` | Execute Playwright end-to-end tests |

---

## 4. Code Standards & Architecture Guidelines

1. **Component Design**:
   - Store generic reusable UI components in `@xyntra/ui`.
   - Feature-specific UI components live inside `apps/web/src/features/[feature_name]/components`.
   - Avoid ad-hoc utility classes or inline color codes; adhere to design tokens in `index.css`.

2. **State Management**:
   - Global application session, merchant profile, and active business state are managed via `auth.store.ts`.
   - Active POS cart state is handled via `cart.store.ts`.
   - Server state fetching, caching, and mutation use TanStack Query (`@tanstack/react-query`).

3. **Type Safety & Schemas**:
   - Schema validation for user inputs must use **Zod** (`zod`).
   - Database and API payload types should be imported from `@xyntra/types`.

4. **Testing Requirements**:
   - Every utility function added to `@xyntra/utils` must include unit tests in `packages/utils/src/__tests__/`.
   - State stores and validation schemas must be covered with Vitest test suites.

---

## 5. Branching & Commit Standards

We follow Conventional Commits:
- `feat:` New features (e.g. `feat: implement offline receipt queue`)
- `fix:` Bug fixes (e.g. `fix: correct tax calculation rounding`)
- `docs:` Documentation changes
- `refactor:` Code refactoring without behavioral changes
- `test:` Adding or updating tests
