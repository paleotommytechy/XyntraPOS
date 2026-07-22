# AGENT.md

> **Project:** XyntraPOS
>
> **Version:** 1.0
>
> **Purpose:** AI Engineering Guide
>
> **Audience:** AI Coding Agents (ChatGPT, Codex, Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, Roo Code, etc.)

---

# Introduction

This document is the **engineering handbook** for every AI agent contributing to XyntraPOS.

Before generating, modifying, reviewing, or deleting any code, the AI **must first understand the project**.

This project is documentation-driven.

Never assume.

Always follow the documented architecture.

---

# Documents to Read First

Before writing code, always understand these documents in this order:

1. PRODUCT.md
2. ROADMAP.md
3. ARCHITECTURE.md
4. DATABASE.md
5. DESIGN.md
6. AGENT.md
7. SKILL.md

If there is a conflict:

```
PRODUCT.md
        ↓
ARCHITECTURE.md
        ↓
DATABASE.md
        ↓
DESIGN.md
        ↓
ROADMAP.md
        ↓
AGENT.md
        ↓
SKILL.md
```

Higher documents take precedence.

---

# Project Goal

Build a production-ready SaaS Point of Sale platform named **XyntraPOS**.

Primary objectives:

- Fast
- Reliable
- Secure
- Scalable
- Maintainable
- AI-friendly

---

# AI Responsibilities

The AI acts as:

- Senior Software Engineer
- Frontend Engineer
- Backend Engineer
- Database Engineer
- UI Engineer
- Code Reviewer
- Technical Writer

The AI **does not** act as a prototype generator.

All generated code should be production-quality.

---

# Development Principles

Every implementation should optimize for:

1. Simplicity
2. Readability
3. Reusability
4. Security
5. Performance
6. Accessibility
7. Scalability

---

# Engineering Philosophy

Before implementing anything, ask:

- Does this align with PRODUCT.md?
- Does it follow the architecture?
- Does it reuse existing components?
- Is there a simpler solution?
- Will this scale?

If the answer is "No", stop and revise.

---

# Technology Stack

The AI must stay within the approved stack unless explicitly instructed otherwise.

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- React Router

State

- TanStack Query
- Zustand

Forms

- React Hook Form
- Zod

Backend

- Supabase
- PostgreSQL
- Edge Functions

External Services

- Cloudinary
- Paystack

Deployment

- Vercel

---

# Folder Rules

Never create random folders.

Always follow:

```
apps/
packages/
docs/
supabase/
```

Inside the web app:

```
src/

app/
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

# Feature Rule

Every feature owns its implementation.

Example:

```
features/products/

components/
hooks/
services/
schemas/
types/
utils/
constants/
```

Never mix unrelated logic.

---

# Component Rules

Always:

- Small
- Reusable
- Typed
- Accessible
- Single responsibility

Avoid giant components.

Prefer composition over deeply nested components.

---

# Page Rules

Pages should:

- Compose features
- Handle layout
- Handle routing

Pages should **not** contain business logic.

---

# Business Logic

Business logic belongs in:

- services
- hooks
- utility functions

Never inside UI components.

---

# API Rules

Every feature owns its API layer.

Example

```
products.api.ts
```

Never call Supabase directly inside components.

Use a service layer.

---

# State Management

Use:

TanStack Query

For:

- Products
- Customers
- Inventory
- Transactions
- Reports

Use:

Zustand

Only for:

- UI state
- Sidebar
- Theme
- Cart
- Local preferences

Do not use Zustand as a server cache.

---

# Forms

Always use:

React Hook Form

Validation:

Zod

Every form requires:

- Validation
- Error messages
- Loading state
- Success state

---

# TypeScript Rules

Never use:

```
any
```

Prefer:

- interfaces
- types
- generics
- enums (only where appropriate)

Enable strict typing.

---

# Styling Rules

Use:

Tailwind CSS

Reusable components from shadcn/ui

Do not write inline styles unless absolutely necessary.

Never hardcode colors.

Use design tokens.

---

# UI Rules

Every screen must support:

- Loading
- Empty
- Error
- Success

Every interaction must provide feedback.

---

# Accessibility

Every component must support:

Keyboard navigation

ARIA labels

Visible focus

Screen readers

Reduced motion

High contrast

Accessibility is not optional.

---

# Performance Rules

Always:

Lazy load routes

Optimize images

Memoize expensive calculations

Paginate tables

Avoid unnecessary renders

Avoid unnecessary API calls

---

# Security Rules

Never trust client input.

Always validate.

Never bypass Row Level Security.

Never expose secret keys.

Never store payment card information.

Always verify Paystack webhooks.

---

# Database Rules

Follow DATABASE.md.

Never create tables outside the documented schema.

Never duplicate data.

Always use foreign keys.

Always use migrations.

---

# Authentication Rules

Authentication is managed by Supabase.

Never implement custom password storage.

Always protect private routes.

Always verify permissions.

---

# Multi-Tenant Rules

Every business owns its own data.

Always scope business queries by:

```
business_id
```

Never expose another tenant's records.

---

# Error Handling

Never fail silently.

Always provide:

Meaningful messages

Retry options where appropriate

Logging for unexpected failures

---

# Logging

Log:

Errors

Warnings

Important business events

Never log:

Passwords

Secrets

Payment details

Sensitive personal information

---

# Naming Conventions

Components

```
ProductCard.tsx
```

Hooks

```
useProducts.ts
```

Stores

```
cart.store.ts
```

Services

```
products.api.ts
```

Schemas

```
product.schema.ts
```

Types

```
product.types.ts
```

---

# Documentation Rules

Whenever a significant feature is added:

Update:

- ROADMAP.md (if scope changes)
- DATABASE.md (if schema changes)
- ARCHITECTURE.md (if architecture changes)
- DESIGN.md (if UI patterns change)

Documentation is part of the feature.

---

# Git Standards

Commits should be small and meaningful.

Example prefixes:

- feat:
- fix:
- refactor:
- docs:
- test:
- chore:
- perf:
- style:

Avoid unrelated changes in a single commit.

---

# Code Review Checklist

Before considering work complete, verify:

- Feature matches PRODUCT.md
- Architecture is respected
- Types are correct
- Validation exists
- Authorization is enforced
- Loading state exists
- Empty state exists
- Error state exists
- Responsive layout works
- Accessibility is considered
- No duplicated logic
- No unused code
- No console logs in production code

---

# What the AI Should Never Do

Never:

- Ignore the documentation.
- Invent database tables.
- Introduce unapproved libraries without justification.
- Duplicate components.
- Mix business logic with UI.
- Store sensitive payment information.
- Disable TypeScript checks.
- Bypass validation.
- Ignore accessibility.
- Sacrifice maintainability for speed.

---

# Definition of Done

A task is complete only if:

- Requirements are satisfied.
- Code follows the architecture.
- UI matches the design system.
- Validation exists.
- Permissions are enforced.
- Types are complete.
- Documentation is updated where necessary.
- Code is maintainable and reusable.

---

# AI Communication Style

When explaining changes:

- Be concise.
- Explain reasoning.
- Highlight trade-offs.
- Reference relevant project documents when appropriate.
- Do not invent requirements.

If requirements are ambiguous, ask for clarification instead of making assumptions.

---

# Final Instruction

Every decision made by the AI should improve one or more of the following:

- User experience
- Code quality
- Security
- Performance
- Maintainability
- Scalability

If a proposed change does not improve at least one of these areas, reconsider the implementation.

> **Build XyntraPOS as if it will be used by thousands of businesses—not just to complete a certification project.**
