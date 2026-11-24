# 06 · Database Integrity & Reconciliation Audit

**Audit Baseline Commit**: `97b76269aefe3d9e9082ece433a0ea4489f019df`  
**Auditor Roles**: Database Integrity Engineer, Jewellery ERP Business Analyst, Senior Full-Stack Software Auditor.

---

## 1. Mathematical Reconciliation Between Reports & Source Records

In a production jewellery ERP, reported figures on the Executive Dashboard and GSTR-1 Audit suite must be mathematically provable from immutable underlying transaction records. We performed an independent mathematical reconciliation across all 14 stores.

### 1.1 Sales & Turnover Reconciliation

$$\text{Reported Sales Turnover} \stackrel{?}{=} \sum_{i \in \text{FinalizedInvoices}} \text{invoice.grandTotal}$$

* **Calculation Across Seeded Database**:
  * Invoice `INV-2026-0001` (Rameshwar Lal, Bridal Necklace): ₹3,68,225
  * Invoice `INV-2026-0002` (Pooja Verma, 18K Diamond Solitaire): ₹77,250
  * Invoice `INV-2026-0003` (Agra Silver Craft, Wholesale 925 Payal): ₹63,860
  * **Sum of Invoices**: **₹5,09,335**
* **Verification in Reports & Dashboard**:
  * `FinancialOverview.tsx` Today's Sales: ₹5,09,335 (100% Match)
  * `ReportsOverview.tsx` Tab 1 (Turnover): ₹5,09,335 (100% Match)
  * `ReportsOverview.tsx` Tab 2 (GSTR-1 Taxable Turnover): ₹4,94,500 + ₹14,835 (3% GST) = ₹5,09,335 (100% Match)
* **Verdict**: 🟢 **RECONCILED (100% Exact Match)**.

---

### 1.2 Physical Inventory & Fine Metal Weight Reconciliation

$$\text{Total Metal Weight} = \sum_{\text{status} \neq \text{'sold'}} \text{item.netWeight}$$
$$\text{Total Fine Bullion Equivalent} = \sum_{\text{status} \neq \text{'sold'}} (\text{item.netWeight} \times \text{item.purityFraction})$$

* **Seeded Physical Stock Inventory**:
  * `stock-1` (`18K Hollow Chain`): Net 10.234g, Purity 0.750 $\rightarrow$ Fine: 7.675g
  * `stock-2` (`22K Solid Bangle`): Net 18.450g, Purity 0.9167 $\rightarrow$ Fine: 16.912g
  * `stock-3` (`18K Solitaire Ring`): Net 3.850g, Purity 0.750 $\rightarrow$ Fine: 2.887g
  * `stock-4` (`22K Rajputana Set`): Net 43.100g, Purity 0.9167 $\rightarrow$ Fine: 39.508g
  * `stock-5` (`925 Silver Payal`): Net 65.500g, Purity 0.925 $\rightarrow$ Fine: 60.587g Silver
  * `stock-6` (`24K Gold Coin`): Net 10.000g, Purity 1.000 $\rightarrow$ Fine: 10.000g Gold
* **Verification in Inventory Manager & Safe Meters**:
  * Total Gold Weight in Safe / Showcase: $10.234 + 18.450 + 3.850 + 43.100 + 10.000 = \mathbf{85.634g}$.
  * Fine Gold Equivalent: $7.675 + 16.912 + 2.887 + 39.508 + 10.000 = \mathbf{76.982g}$.
  * Fine Silver Equivalent: $\mathbf{60.587g}$.
* **Verdict**: 🟢 **RECONCILED (100% Exact Milligram Match)**.

---

### 1.3 Karigar Bullion Ledger Reconciliation

$$\text{Artisan Fine Gold Balance} = \sum \text{Gold Issued} - \sum \text{Fine Gold Received} - \sum \text{Ghat Allowed}$$

* **Calculation for Babulal Soni (`karigar-1`)**:
  * Initial Balance: 24.500g pure gold.
  * Issue Metal Transaction (`kt-1`): +50.000g 24K pure bar $\rightarrow$ Balance: 74.500g.
  * Receive Ornament (`kt-2`): Received 45.000g 22K (41.250g fine) + 0.675g Ghat $\rightarrow$ Deducts 41.925g fine gold $\rightarrow$ Balance: **32.575g**.
* **Verification in Karigar Store**:
  * `karigars.find(k => k.id === 'karigar-1').pureGoldBalanceGrams`: **32.575g** (100% Match).
* **Verdict**: 🟢 **RECONCILED (0.000g Discrepancy)**.

---

## 2. Arithmetic & Decimal Precision Analysis

### 2.1 The Tunch & Karat Ratio Precision Engine
Jewellery calculations in India rely on exact fractional ratios rather than binary floating-point approximations:
* $22\text{K} = \frac{22}{24} = 0.9166666...$
* $18\text{K} = \frac{18}{24} = 0.7500$
* $14\text{K} = \frac{14}{24} = 0.5833333...$

* **Test Result**: When calculating 10g 22K gold @ ₹1,50,000 / 10g 24K benchmark:
  $$\text{Effective 22K Rate} = \text{round}\left(\frac{150000}{24} \times 22\right) = ₹1,37,500$$
  $$\text{10g 22K with 18\% Making} = ₹1,37,500 \times 1.18 = ₹1,62,250$$
* In `src/modules/pricing/engine.ts`, all arithmetic uses `Decimal.js` (`new Decimal(gold24k).dividedBy(24).times(karat)`), preventing IEEE 754 floating-point rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
* **Verdict**: 🟢 **PASS**.

---

## 3. Transaction Atomicity & Partial Write Hazards

Because the application currently updates client-side stores sequentially using JavaScript function calls rather than a database transaction (`BEGIN ... COMMIT ... ROLLBACK`), the system is vulnerable to **partial writes** during client exceptions or browser crashes.

```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant UI as Page.tsx
    participant StockStore as inventory/store.ts
    participant ScrapStore as scrap/store.ts
    participant InvStore as invoicing/store.ts
    participant CustStore as customers/store.ts

    Cashier->>UI: Click "Finalize Bill"
    UI->>StockStore: 1. lockInvoicedStockItems() -> SUCCESS
    UI->>ScrapStore: 2. ingestOldGoldScrap() -> SUCCESS
    Note over UI,InvStore: BROWSER CRASH / NETWORK FAILURE / TAB CLOSED
    UI--xInvStore: 3. saveNewInvoice() -> FAILED (Never Executed)
    UI--xCustStore: 4. recordInvoiceToCustomer() -> FAILED (Never Executed)
```

### Partial Write Hazard Analysis
1. In `src/app/page.tsx` lines 406–437:
   * Step 1: `lockInvoicedStockItems` executes and marks the necklace as `sold`.
   * Step 2: `ingestOldGoldScrap` executes and saves scrap to storage.
   * Step 3: `saveNewInvoice` writes the invoice.
   * Step 4: `recordInvoiceToCustomer` updates customer dues.
2. If an unhandled exception or storage quota error occurs during Step 3:
   * The necklace is locked as `sold` in inventory.
   * But the invoice was never recorded in the invoices registry.
   * The customer ledger was never updated.
   * **Result**: An orphaned sold stock item with no corresponding invoice and no payment record!

* **Required Production Remediation**:
  Wrap all steps in a single atomic server-side Prisma transaction:
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.stockItem.updateMany({ ... });
    await tx.invoice.create({ ... });
    await tx.payment.createMany({ ... });
    await tx.customer.update({ ... });
    await tx.journalEntry.create({ ... });
  });
  ```

---

## 4. Prisma Relational Schema Gap Analysis

Comparing `prisma/schema.prisma` against all 14 application modules:

```mermaid
pie title Prisma Schema Coverage (14 Modules)
    "Covered in Schema (Core)" : 7
    "Missing from Schema (Dormant/Client-Only)" : 7
```

| Entity / Domain Concept | Client Store Type | Prisma Schema Status | Foreign Key & Relation Status |
| :--- | :--- | :---: | :--- |
| **Business / Tenant** | `JewellerTenant` (String ID) | `model Business` (`@db.Uuid`) | 🔴 **MISMATCH**: Client uses string IDs (`tenant-sandhya-jaipur`), schema expects UUID. |
| **Stock Items** | `StockItem` (Milligram weights) | `model StockItem` (`Decimal(10,3)`) | 🟢 **COMPATIBLE**: Exact 3-decimal milligram precision matches. |
| **Invoices & Payments** | `FinalizedInvoice`, `SplitPayment` | `model Invoice`, `model Payment` | 🟢 **COMPATIBLE**: 1-to-many relationship defined. |
| **Old-Gold Scrap Entry** | `OldGoldExchangeItem` | `Invoice.oldGoldDeduction` (Scalar) | 🟡 **INCOMPLETE**: No line-item model for individual scrap lots or melting purity. |
| **Wholesale Consignment Memos**| `ConsignmentMemo`, `B2BPartner` | **MISSING** | 🔴 **NOT IN SCHEMA**: No models for consignment memos (जांगड़) or B2B partners. |
| **Repairs & Custom Bookings** | `RepairJob`, `CustomBookingOrder` | **MISSING** | 🔴 **NOT IN SCHEMA**: No models for repair jobs or custom booking rate locks. |
| **Manufacturing Job Cards** | `JobCard` | **MISSING** | 🔴 **NOT IN SCHEMA**: `KarigarTransaction` exists, but `JobCard` lifecycle is missing. |
| **Wholesale Purchases & Bills** | `PurchaseInvoice`, `SupplierPayment`| **MISSING** | 🔴 **NOT IN SCHEMA**: `Supplier` exists, but multi-item purchase bills are missing. |
| **Daily Cash Closings (रोकड़)** | `DailyCashClosing`, `ShopExpense` | **MISSING** | 🔴 **NOT IN SCHEMA**: No models for physical denomination tallies or petty expenses. |
| **Staff & Salary Advances** | `StaffMember`, `StaffPaymentRecord` | **MISSING** | 🔴 **NOT IN SCHEMA**: `User` exists for login, but staff payroll ledger is missing. |
| **Master Showroom Settings** | `ShowroomMasterSettings` | **MISSING** | 🔴 **NOT IN SCHEMA**: No model for A4/thermal setup, barcode tags, or bank details. |

---

## 5. Reconciliation Summary Table

| Domain Subsystem | Reconciled Status | Invariant Formula Maintained | Integrity Risks |
| :--- | :---: | :--- | :--- |
| **Sales Turnover** | 🟢 100% Match | Invoices sum matches Dashboard & GSTR-1 | None in client memory |
| **Gold & Silver Weights** | 🟢 100% Match | Gross - Deductions = Net; Net * Purity = Fine | None in client memory |
| **Karigar Bullion Ledger** | 🟢 100% Match | Balance = Issues - (Returns + Ghat) | Isolated from central stock |
| **Girvi Monthly Interest** | 🟢 100% Match | $I = P \times R \times T$ (Simple & Compound) | Isolated from cash drawer |
| **Daily Cash Closing** | 🟢 100% Match | Expected = Opening + Receipts - Disbursals | Reliant on manual cash inputs |
| **ACID Multi-Store Writes** | 🔴 Unsafe | No atomic commit across 4 client stores | Risk of partial writes on browser crash |
| **Prisma Relational Database**| 🔴 Disconnected | Schema covers 7 of 14 modules | 7 modules missing models; 0 migrations |
