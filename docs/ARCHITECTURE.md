# ARCHITECTURE.md

> **Project:** XyntraPOS
>
> **Version:** 1.0
>
> **Status:** Architecture Specification
>
> **Purpose:** Define the complete software architecture, technology decisions, design patterns, and development principles used throughout XyntraPOS.
>
> **Priority:** High (Single Source of Technical Truth)

---

# 1. Overview

XyntraPOS is a modern cloud-based Software as a Service (SaaS) Point of Sale (POS) platform that enables businesses to manage products, inventory, customers, sales, staff, payments, and business analytics from anywhere.

The system is designed to be:

- Scalable
- Secure
- Responsive
- Maintainable
- Production Ready
- AI-Friendly

---

# 2. Architecture Principles

Every architectural decision must follow these principles.

## Simplicity

Avoid unnecessary complexity.

If Supabase already provides a feature, use it.

---

## Scalability

Design today's code for tomorrow's features.

Every module should be replaceable without affecting the rest of the application.

---

## Security

Security is built into every layer.

Never trust client-side data.

Always enforce permissions at the database level.

---

## Modularity

Each feature owns its own:

- UI
- Business logic
- Validation
- API
- Types

---

## Performance

Fast interfaces.

Small bundles.

Optimized queries.

Lazy loading.

Minimal re-renders.

---

## Developer Experience

The project should be enjoyable to work on.

Readable code.

Predictable folder structure.

Clear naming.

Good documentation.

---

# 3. High-Level Architecture

```
                    Browser

                        │

                        ▼

          React + TypeScript + Vite

                        │

      TanStack Query + Zustand

                        │

                Supabase Client

      ┌──────────────┼──────────────┐

      ▼              ▼              ▼

 Authentication   Database      Realtime

                      │

                 PostgreSQL

      ┌──────────────┼──────────────┐

      ▼              ▼              ▼

Cloudinary      Paystack      Edge Functions

```

---

# 4. Technology Stack

## Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide React
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Sonner

---

## Backend

Supabase

Includes:

- PostgreSQL
- Authentication
- Storage
- Realtime
- Edge Functions
- Row Level Security

---

## Third Party Services

Cloudinary

Product Images

Business Logos

Receipt Assets

---

Paystack

Payment Processing

Payment Verification

Webhooks

---

Deployment

Frontend

Vercel

Backend

Supabase Cloud

---

# 5. Architecture Style

Feature-First Architecture

```
src/

features/

products/

customers/

inventory/

sales/

payments/

dashboard/

settings/

```

Every feature owns everything related to itself.

---

# 6. Monorepo Structure

```
xyntrapos/

apps/

    web/

packages/

    ui/

    types/

    utils/

supabase/

    migrations/

    functions/

docs/

public/

```

---

# 7. Frontend Architecture

```
App

↓

Layout

↓

Page

↓

Feature

↓

Components

↓

Hooks

↓

API

↓

Supabase
```

Pages should contain almost no business logic.

Features contain the application logic.

---

# 8. Feature Structure

```
products/

components/

hooks/

schemas/

types/

services/

pages/

utils/

constants/

```

Every feature is isolated.

---

# 9. Shared Packages

## ui

Reusable UI Components

Buttons

Cards

Tables

Dialogs

Forms

---

## types

Shared TypeScript types.

---

## utils

Utility functions.

Formatters.

Helpers.

Validators.

---

# 10. Routing

Public Routes

```
/

login

register

forgot-password

reset-password
```

---

Protected Routes

```
/dashboard

/products

/customers

/inventory

/sales

/payments

/reports

/settings

/profile
```

---

# 11. State Management

Global State

Use Zustand.

Examples

Authenticated User

Business

Theme

Sidebar

POS Cart

---

Server State

Use TanStack Query.

Examples

Products

Customers

Transactions

Reports

Inventory

---

Forms

React Hook Form

Validation

Zod

---

# 12. Authentication Flow

```
Login

↓

Supabase Auth

↓

JWT Session

↓

Protected Route

↓

Fetch User Profile

↓

Load Business

↓

Load Permissions

↓

Dashboard
```

---

# 13. Authorization

Role Based Access Control

Roles

Admin

Manager

Cashier

Permissions are enforced through

Supabase Row Level Security

Never only in the frontend.

---

# 14. Multi-Tenant Architecture

Every business owns its own data.

```
Business

↓

Stores

↓

Products

↓

Customers

↓

Transactions

↓

Inventory

↓

Staff

↓

Reports
```

Every table references

business_id

No tenant should ever access another tenant's data.

---

# 15. Data Flow

Example

Create Product

```
User

↓

React Form

↓

Validation (Zod)

↓

TanStack Mutation

↓

Supabase

↓

Postgres

↓

Realtime Update

↓

UI Refresh
```

---

# 16. Payment Flow

```
Checkout

↓

Create Transaction

↓

Paystack

↓

Customer Pays

↓

Webhook

↓

Verify Payment

↓

Update Database

↓

Generate Receipt

↓

Reduce Inventory

↓

Dashboard Updates
```

Card details are NEVER stored.

---

# 17. Image Upload Flow

```
Choose Image

↓

Cloudinary Upload

↓

Receive URL

↓

Save URL

↓

Supabase Database

↓

Display Product
```

---

# 18. Folder Structure

```
src/

app/

assets/

components/

features/

hooks/

layouts/

lib/

providers/

routes/

services/

stores/

styles/

types/

utils/

```

---

# 19. API Layer

Every feature owns its own API.

Example

```
products/

services/

products.api.ts

products.query.ts

```

Never mix APIs from different features.

---

# 20. UI Layer

Reusable Components

Button

Input

Card

Table

Dialog

Modal

Badge

Avatar

Chart

Pagination

Search

---

Feature Components

Product Card

POS Cart

Receipt

Dashboard Cards

Inventory Table

---

# 21. Error Handling

Every request must handle

Loading

Success

Empty

Error

Retry

No silent failures.

---

# 22. Loading Strategy

Skeletons

Progress Indicators

Optimistic Updates

Lazy Loading

Infinite Scroll where appropriate

---

# 23. Performance Strategy

Code Splitting

Route Lazy Loading

Image Optimization

Pagination

Memoization

Database Indexes

Avoid unnecessary re-renders.

---

# 24. Security Architecture

Supabase Authentication

HTTPS

Environment Variables

Row Level Security

Webhook Verification

Role Permissions

Input Validation

Audit Logs

No sensitive payment information stored.

---

# 25. Realtime Features

Realtime Inventory

Realtime Dashboard

Realtime Notifications

Realtime Sales Feed

Powered by

Supabase Realtime

---

# 26. Logging

Client Errors

Application Events

Audit Logs

Payment Logs

Future

Sentry Integration

---

# 27. Deployment Architecture

```
Developer

↓

GitHub

↓

Vercel

↓

Production

↓

Supabase

↓

Cloudinary

↓

Paystack
```

Automatic deployment.

---

# 28. Coding Standards

Everything uses

TypeScript

Feature-first architecture

Functional Components

Custom Hooks

Composition over inheritance

Reusable Components

No duplicated logic.

---

# 29. Naming Conventions

Components

```
ProductCard.tsx
```

Hooks

```
useProducts.ts
```

Schemas

```
product.schema.ts
```

Services

```
products.api.ts
```

Types

```
product.types.ts
```

Stores

```
cart.store.ts
```

---

# 30. Future Architecture

Version 2

Offline Sync

React Native App

Barcode Scanner

Receipt Printer

Redis Cache

Background Jobs

Supplier Module

Purchase Orders

Accounting

AI Insights

Microservices (only if justified)

---

# 31. Architecture Rules

Always:

✅ Use shared UI components.

✅ Validate with Zod.

✅ Use React Hook Form.

✅ Fetch data with TanStack Query.

✅ Use Zustand only for client state.

✅ Use Supabase for backend services.

✅ Keep business logic inside feature modules.

✅ Write reusable code.

Never:

❌ Store business logic inside pages.

❌ Duplicate components.

❌ Skip validation.

❌ Bypass Row Level Security.

❌ Store payment card information.

❌ Create tightly coupled modules.

---

# 32. Definition of Good Architecture

A feature is considered architecturally complete when:

- It follows the folder structure.
- It is modular.
- It is reusable.
- It is fully typed.
- It is validated.
- It follows the design system.
- It follows security rules.
- It supports future scaling.
- It includes loading, success, empty, and error states.

---

# 33. Final Principle

The architecture of XyntraPOS should enable new developers and AI coding agents to understand, extend, and maintain the application with minimal onboarding.

Every technical decision should prioritize clarity, maintainability, and long-term scalability over unnecessary complexity.
