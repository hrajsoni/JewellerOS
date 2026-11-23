# JewelleryOS · Milestone 0: Existing Application Audit

> **Comprehensive Assessment of Codebase, Working Modules, Data Layers, and ERP Upgrade Plan**  
> Completed: November 2026 | Developer: Harshit Raj | Showroom: Sandhya Jewellers

---

## 1. Executive Audit Summary

The existing JewelleryOS codebase is in an **exceptionally strong initial state**:
* **Visual & UX Polish**: The obsidian liquid glass aesthetic, animations (`framer-motion`), bilingual labels (Hindi/English), and mobile responsiveness are fully built and functioning.
* **Math & Domain Engine**: The core financial pricing engine (`src/modules/pricing/engine.ts`) is rock-solid with arbitrary precision (`Decimal.js`), 13/13 passing automated acceptance tests, and verified against Harshit's counter notebooks ($10\text{g } 18\text{K } @\text{ } 18\% = ₹1,32,750$, $10\text{g } 22\text{K } @\text{ } 18\% = ₹1,62,250$).
* **Working Modules (Interactive UI)**:
  1. Counter Pricing Terminal with Privacy Shield Eye mode
  2. Quick Cart Drawer with Split Payments (Cash/UPI/Card) & WhatsApp quotes
  3. Official GST Tax Invoice preview & printing (Form A4 & thermal)
  4. Girvi Pawn Book with Form 7 pledge vouchers, safe locations (`Tijori #1, Dabba #A`), packet tags (`PKT-101`), and multi-facet search/sort/date filters
  5. Karigar Artisan Ledger (issue metal, receive ornaments, ghat/wastage, labour balance)
  6. Staff Roster & Salary register with cash advances (पेशगी)
  7. Inventory Stock list with tray locations and load-to-calculator
  8. Customer directory with outstanding balances
  9. Showroom switcher with multi-tenant partition prefixing.

---

## 2. Core Architectural Gaps Identified (The Upgrade Target)

While the user interface and local simulation are complete, transforming JewelleryOS into a production-grade ERP requires addressing four key architectural limitations:

| Gap Area | Current Implementation | Production ERP Target |
| :--- | :--- | :--- |
| **Data Persistence** | Browser `localStorage` partitioned by tenant ID (`jewellery_os_tenant_${tenantId}_*`). Data is local to the device terminal. | Central **PostgreSQL** database accessed via **Prisma ORM**, enabling multi-terminal counter synchronization and offsite backups. |
| **Authentication & RBAC** | Client-side tenant switching modal; any user has full visibility. | Server-side **Session Authentication** with role-based permissions (Salesperson cannot see purchase costs, profit margins, or owner accounts). |
| **Product vs Stock Item** | Inventory treats designs and stock pieces somewhat uniformly. | Strict relational separation: **Product (Master Design)** vs **StockItem (Individual physical piece with unique barcode, exact gross/net weight, and tray location)**. |
| **Financial Ledger Integrity** | Invoices update client totals directly. | **Double-Entry Journal Entries** (Debit Cash/Bank/Receivable, Credit Jewellery Revenue/Payable) posted atomically inside DB transactions. |

---

## 3. Preserved Assets (What We Are Keeping)

In accordance with our guiding rule (**"We will not throw away your existing Jewellery OS and start from zero"**):
1. **Preserve All UI Components**: `CounterCalculator.tsx`, `CounterQuickCartDrawer.tsx`, `BillingWorkspace.tsx`, `GirviManager.tsx`, `KarigarManager.tsx`, `StaffManager.tsx`, `TaxInvoiceModal.tsx`, and all `glass/*` design components.
2. **Preserve Pricing Engine**: `src/modules/pricing/engine.ts` and `tests/pricing/engine.test.ts`.
3. **Preserve Visual Tokens**: `src/styles/glass-tokens.css` and dark obsidian styling.
4. **Preserve Shop Branding**: Sandhya Jewellers (Harshit Raj) default profile.

---

## 4. Phased Implementation Sequence (Milestones 1 to 9)

```
[Milestone 0: Audit & Documentation]  <-- COMPLETED
        |
        v
[Milestone 1: Database & Foundation]  <-- NEXT IMMEDIATE STEP
  - Set up Prisma + PostgreSQL schema
  - Implement Owner & Employee Authentication (RBAC)
  - Business & Branch database records
        |
        v
[Milestone 2: Metal Rates & Pricing Engine Sync]
  - PostgreSQL metal_rates table with historical timestamps
  - Hook Counter Calculator to live database rates
        |
        v
[Milestone 3: Inventory & Barcode Subsystem]
  - Product Master vs Stock Item migration
  - Barcode label generation & scanner lookup
        |
        v
[Milestone 4: POS & Billing Atomic Pipeline]
  - Server Action invoice finalization inside Prisma transaction
  - Lock stock items, post split payments, generate GST invoice
        |
        v
[Milestones 5 - 9: Purchases, Karigar, Accounts, Wholesale, PWA Launch]
```
