# JewelleryOS · System Architecture

> **The Operating System for Jewellery Businesses**  
> Modular Monolith Architecture for High-Reliability Jewellery Retail, Wholesale, Karigar Manufacturing, and Financial Accounting.

---

## 1. Architectural Philosophy & Principles

JewelleryOS is engineered as a **Modular Monolith** designed to be operated and maintained by a focused development team without unnecessary operational overhead (avoiding premature microservices, message queues, or container orchestration clusters).

### Core Architectural Directives
1. **Jewellery-Domain Fidelity**: Every gram, carat, and rupee is traceable. Quantities and weights are never rounded arbitrarily.
2. **Deterministic Financial Math**: Zero IEEE-754 floating-point inaccuracies. All monetary amounts and metal weights use arbitrary-precision decimal representations (`Decimal.js` in frontend / `NUMERIC` & `@prisma/client/runtime` `Prisma.Decimal` on backend).
3. **Server-Enforced Authority**: The client browser or terminal never dictates stock balances, account balances, or final invoice totals. All mutations execute within validated server-side database transactions.
4. **Immutable Financial History**: Finalized invoices, payment records, and journal vouchers are immutable. Amendments and cancellations produce counter-balancing credit notes or reversal entries rather than destructive deletes.
5. **Multi-Tenant with Branch Awareness**: Data partition is anchored on `business_id` and optional `branch_id`, supporting single-store deployment today and multi-branch / multi-tenant SaaS scaling tomorrow.

---

## 2. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              CLIENT / USER INTERFACE                              |
|   Windows Desktop Browser  *  PWA Mobile Screen  *  Counter POS Barcode Terminal   |
+-----------------------------------------------------------------------------------+
                                         |
                                         | HTTPS (JSON / Server Actions)
                                         v
+-----------------------------------------------------------------------------------+
|                        NEXT.JS MODULAR MONOLITH CORE                              |
|                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+           |
|  |   Authentication   |  |     RBAC Guard     |  |   Zod Validation   |           |
|  |  (Sessions / JWT)  |  | (Owner vs Employee)|  |     (Payloads)     |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            DOMAIN SERVICES                                  |  |
|  |  [Counter Pricing Engine]      [Inventory & Stock Movements]                 |  |
|  |  [Sales & Billing Workspace]   [Purchases & Supplier Ledgers]               |  |
|  |  [Customer KYC & Ledgers]      [Karigar Bullion & Labour Accounting]        |  |
|  |  [Girvi & Gold Loan Engine]    [Double-Entry Accounts & Cashbook]           |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                                         | Atomic Prisma Transactions              |
|                                         v                                         |
+-----------------------------------------------------------------------------------+
                                         |
                                         | TCP / Connection Pooler (PgBouncer)
                                         v
+-----------------------------------------------------------------------------------+
|                         POSTGRESQL RELATIONAL DATABASE                            |
|                                                                                   |
|  - businesses & branches           - products & stock_items                       |
|  - stock_movements (audit log)     - metal_rates & pricing_rules                  |
|  - invoices & invoice_items        - payments & allocations                       |
|  - customers & suppliers           - karigars & metal_reconciliation              |
|  - accounts & journal_entries      - girvi_loans & pawn_parchi                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Technology Stack Breakdown

| Layer | Selected Technology | Rationale & Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) + React 19 | Server Components for instant data rendering; Client Components for fluid liquid glass UI. |
| **Language** | TypeScript 5 (Strict Mode) | End-to-end type safety spanning DB models to UI props. |
| **Styling & Motion** | Tailwind CSS v4 + Framer Motion | Obsidian Glass tokens, backdrop-filter blurs, responsive mobile drawers, and smooth drawers. |
| **Precision Math** | `Decimal.js` | 100% exact karatage ratios ($K/24$), making charge percentages, and GST rounding. |
| **Backend & APIs** | Next.js Server Actions & Route Handlers | Colocated API layer eliminating separate backend deployment overhead. |
| **Database** | PostgreSQL 16+ | ACID transactional integrity, relational foreign keys, row-level locking for inventory. |
| **ORM** | Prisma ORM | Type-safe query building, migration management, and nested transactional writes. |
| **Validation** | Zod v3 | Schema validation on every incoming server request and form submission. |
| **Authentication** | Auth.js (NextAuth) or Secure Session Cookies | Passwords hashed with Argon2id/bcrypt; secure HTTP-only cookies; RBAC session token. |
| **Hosting & Cloud** | Vercel + Neon / Supabase PostgreSQL | Serverless zero-config edge deployments with automated database branching and backups. |

---

## 4. Key Architectural Patterns

### A. The "Product Design" vs "Stock Item" Separation
In standard retail, a barcode points to a general SKU with a quantity count. In jewellery:
* **Product**: Represents a design blueprint (e.g., *"18K Diamond Solitaire Ring Model 402"*).
* **Stock Item**: Represents a **unique physical piece** with its own:
  * Unique Barcode / RFID tag
  * Exact gross weight (e.g. 4.238g vs 4.312g for identical designs)
  * Net metal weight and specific stone deduction
  * Individual acquisition cost and tray location.

### B. Audit-Trail Stock Movements
Stock items are never updated destructively in-place without a paper trail. Every change in stock status (`in_showcase` $\rightarrow$ `sold`, `in_showcase` $\rightarrow$ `karigar_issued`, etc.) creates an immutable row in `stock_movements` referencing the initiating invoice, purchase entry, or work order.

### C. Atomic Financial & Stock Transactions
When an ornament is sold:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verify and lock the stock item (prevent concurrent double-selling)
  const item = await tx.stockItem.findUnique({ where: { id: itemId } });
  if (item.status !== "in_showcase") throw new Error("Item already sold or reserved");

  // 2. Mark item as sold
  await tx.stockItem.update({ where: { id: itemId }, data: { status: "sold" } });

  // 3. Create stock movement record
  await tx.stockMovement.create({ ... });

  // 4. Create immutable invoice snapshot
  const invoice = await tx.invoice.create({ ... });

  // 5. Post payments & update customer ledger
  await tx.payment.create({ ... });
  await tx.customerLedger.create({ ... });

  // 6. Post double-entry journal entries (Debit Cash/Bank, Credit Jewellery Sales)
  await tx.journalEntry.create({ ... });
});
```

---

## 5. Offline & Reliability Strategy

* **PWA Application Shell**: Service workers cache static assets, design tokens, and UI components for instant load even when internet connectivity drops.
* **Safe Read-Only Offline**: Users can look up existing cached stock items and view rates when offline.
* **Never Fake Transaction Completion**: The application displays an explicit status banner if offline. Financial transactions (sales, purchases, loan disbursals) require server confirmation before declaring "Invoice Finalized".
