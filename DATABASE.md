# DATABASE.md

> **Project:** XyntraPOS
>
> **Version:** 1.0
>
> **Status:** Database Specification
>
> **Database:** PostgreSQL (Supabase)
>
> **Purpose:** Define the complete database architecture, relationships, conventions, security model, and migration strategy for XyntraPOS.

---

# 1. Overview

XyntraPOS uses **Supabase PostgreSQL** as its primary transactional database.

The database is designed around:

- Multi-tenancy
- ACID compliance
- Row Level Security (RLS)
- Data integrity
- Scalability
- Auditability

The database is the **single source of truth** for all business operations.

---

# 2. Database Principles

Every table must follow these principles:

- One responsibility per table.
- No duplicated data.
- Every table has a primary key.
- Foreign keys must enforce relationships.
- Soft deletes where appropriate.
- Every business owns its own data.
- Business rules are enforced at the database level whenever possible.

---

# 3. Multi-Tenant Architecture

Every merchant is isolated.

```
Business
    │
    ├── Users
    ├── Stores
    ├── Products
    ├── Categories
    ├── Customers
    ├── Transactions
    ├── Payments
    ├── Inventory
    └── Settings
```

Every business-specific table includes:

```sql
business_id UUID NOT NULL
```

This enables secure tenant isolation using Row Level Security.

---

# 4. Naming Conventions

## Tables

Plural

```
products
customers
transactions
```

---

## Primary Keys

```
id UUID PRIMARY KEY
```

---

## Foreign Keys

```
business_id

product_id

customer_id

transaction_id
```

---

## Timestamps

Every table should contain:

```
created_at

updated_at
```

Optional:

```
deleted_at
```

---

## Boolean Fields

```
is_active

is_deleted

is_default
```

---

# 5. Core Tables

## Authentication

Supabase manages authentication.

Additional user information is stored in:

### profiles

Stores

- name
- avatar
- phone
- role
- business_id

---

## businesses

Represents a merchant.

Fields

- id
- name
- logo
- email
- phone
- currency
- timezone
- tax_rate
- address
- created_at
- updated_at

---

## stores

Supports future multi-branch expansion.

Fields

- id
- business_id
- name
- address
- phone
- is_default

---

## roles

System roles.

Examples

- Admin
- Manager
- Cashier

---

## user_roles

Maps users to roles.

Supports future multiple-role assignments.

---

# 6. Product Module

## categories

Fields

- id
- business_id
- name
- description
- created_at

---

## products

Fields

- id
- business_id
- category_id
- sku
- barcode
- name
- description
- image_url
- cost_price
- selling_price
- stock_quantity
- minimum_stock
- tax_rate
- is_active
- created_at
- updated_at

---

## inventory_logs

Tracks every inventory movement.

Fields

- id
- business_id
- product_id
- movement_type
- quantity
- previous_stock
- new_stock
- reason
- reference_id
- created_by
- created_at

Movement Types

- STOCK_IN
- STOCK_OUT
- SALE
- RETURN
- ADJUSTMENT

---

# 7. Customer Module

## customers

Fields

- id
- business_id
- first_name
- last_name
- phone
- email
- address
- notes
- created_at

---

# 8. Sales Module

## transactions

Represents one completed sale.

Fields

- id
- business_id
- store_id
- customer_id
- cashier_id
- subtotal
- discount
- tax
- total
- payment_status
- transaction_status
- receipt_number
- created_at

Status

Pending

Completed

Cancelled

Refunded

---

## transaction_items

Stores products sold.

Fields

- id
- transaction_id
- product_id
- quantity
- unit_price
- discount
- total

---

# 9. Payments

## payments

Fields

- id
- transaction_id
- business_id
- provider
- payment_method
- amount
- currency
- payment_reference
- provider_reference
- status
- paid_at

Providers

Paystack

Cash

Transfer

Card

Status

Pending

Success

Failed

Refunded

---

# 10. Settings

## business_settings

Fields

- id
- business_id
- receipt_footer
- tax_enabled
- currency
- timezone
- printer_enabled
- email_receipts

---

# 11. Audit

## audit_logs

Every important action is recorded.

Fields

- id
- business_id
- user_id
- action
- table_name
- record_id
- old_values
- new_values
- ip_address
- created_at

---

# 12. Notifications

## notifications

Fields

- id
- business_id
- user_id
- title
- message
- type
- is_read
- created_at

---

# 13. Relationships

```
Business

│

├── Users

├── Stores

├── Categories

│      │

│      ▼

│   Products

│      │

│      ▼

│ Inventory Logs

│

├── Customers

│

├── Transactions

│      │

│      ▼

│ Transaction Items

│

├── Payments

│

└── Settings
```

---

# 14. Database Constraints

Every product

Must belong to a business.

---

Every transaction

Must belong to one business.

---

Inventory

Cannot become negative.

---

Payment

Cannot exceed transaction amount.

---

Receipt Number

Must be unique.

---

SKU

Unique within a business.

---

Barcode

Unique within a business.

---

# 15. Indexing Strategy

Indexes

business_id

product_id

customer_id

transaction_id

payment_reference

created_at

receipt_number

barcode

sku

phone

email

---

# 16. Soft Delete Strategy

Use

```
deleted_at
```

Instead of permanently deleting

Products

Customers

Categories

Stores

---

Transactions

Never deleted.

---

Payments

Never deleted.

---

Audit Logs

Never deleted.

---

# 17. Row Level Security

Every business sees only its own records.

Example Policy

```
business_id = current_user_business_id
```

Policies are required for

Products

Customers

Inventory

Transactions

Payments

Reports

Settings

Notifications

Audit Logs

---

# 18. Data Integrity Rules

Transactions

Immutable after completion.

---

Payments

Cannot exist without a transaction.

---

Inventory

Every stock movement creates an inventory log.

---

Deleting a category

Not allowed while products exist.

---

Deleting a product

Allowed only if never sold.

Otherwise

Deactivate.

---

# 19. Migration Strategy

Every database change requires:

Migration file

Migration review

Rollback strategy

Seed update

Documentation update

---

Folder

```
supabase/

migrations/
```

---

# 20. Seed Data

Development database should include

Admin User

Sample Business

Sample Store

Categories

Products

Customers

Transactions

Reports

Roles

---

# 21. Backup Strategy

Production

Daily Backups

Point-in-Time Recovery

Migration History

---

# 22. Future Tables

Version 2

suppliers

purchase_orders

expenses

expense_categories

shipments

returns

refunds

loyalty_points

gift_cards

branches

warehouses

inventory_transfers

promotions

coupons

subscriptions

plans

invoices

api_keys

webhooks

sessions

activity_logs

---

# 23. Performance Strategy

Pagination

Indexes

Efficient joins

Avoid N+1 queries

Use aggregate queries

Limit large payloads

---

# 24. Security Rules

Never store

Card Numbers

CVV

PIN

Passwords

Passwords are managed exclusively by Supabase Auth.

---

# 25. Definition of Done

A database feature is complete when:

- Schema is normalized.
- Relationships are enforced.
- RLS policies exist.
- Indexes are added.
- Constraints are defined.
- Migration is created.
- Seed data is updated.
- Documentation is updated.

---

# 26. Future Scalability

The schema must support future features without major restructuring.

Future support includes:

- Multiple businesses
- Multiple stores
- Multiple currencies
- Multiple payment providers
- Offline synchronization
- AI analytics
- Native mobile apps
- Third-party integrations

---

# 27. Database Principles

The database should always prioritize:

1. Data Integrity
2. Security
3. Performance
4. Scalability
5. Simplicity
6. Maintainability

---

# 28. Final Principle

Every table, relationship, constraint, and policy should contribute to one goal:

> **Maintain accurate, secure, and reliable business data while enabling XyntraPOS to scale from a single merchant to thousands of businesses without changing the core database architecture.**
