---
name: postgres-prisma
description: PostgreSQL relational data modeling, Prisma schema management, multi-tenant indexing, and atomic transactions.
---

# PostgreSQL & Prisma Skill

## 1. Schema Modeling Standards
- **Primary Keys:** `@id @default(cuid())` for predictable distributed IDs.
- **Timestamps:** `@default(now()) @db.Timestamptz` and `@updatedAt @db.Timestamptz`.
- **Decimals:** `@db.Decimal(precision, scale)`.
  - Weights: `@db.Decimal(10, 3)` (up to 9,999,999.999 grams).
  - Currency: `@db.Decimal(12, 2)` (up to ₹9,999,999,999.99).
  - Purity: `@db.Decimal(6, 4)` (e.g. 0.9167).
- **Naming Conventions:**
  - Prisma Models: PascalCase (e.g. `StockItem`, `ProductVariant`).
  - Table Names: snake_case via `@@map("stock_items")`.
  - Columns: camelCase in Prisma, mapped to snake_case in SQL.

---

## 2. Multi-Tenant Relational Modeling
- **Foreign Key Invariant:** Every tenant-scoped model must have a foreign key to `Business`:
  ```prisma
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Restrict)
  ```
- **Composite Unique Constraints:** Scoped per business:
  ```prisma
  @@unique([businessId, code])
  @@unique([businessId, barcode])
  ```

---

## 3. Serverless Neon PostgreSQL Best Practices
- **Connection Pooling:** Use Prisma Accelerate or Neon pooled connection strings (`?sslmode=require&pgbouncer=true`) for Next.js API routes.
- **Interactive Transactions:** Set reasonable transaction timeouts (`maxWait: 5000`, `timeout: 10000`) for atomic multi-table updates.
- **Safe Migrations:** Avoid destructive column drops in production. Use additive migrations and backfill scripts.
