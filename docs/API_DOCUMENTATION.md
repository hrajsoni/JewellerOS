# JewelleryOS · Server Actions & API Documentation

> **Contract Specifications for Next.js Server Actions & API Handlers with Zod Validation**

---

## 1. Authentication & Sessions

### `POST /api/auth/login` (or Server Action `authenticateUser`)
* **Access**: Public
* **Input Schema (Zod)**:
```typescript
export const LoginInputSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(6),
  businessSlug: z.string().optional(),
});
```
* **Output**:
  * Set HTTP-Only Secure Cookie (`jewellery_os_session`)
  * User profile: `{ id, fullName, role, businessId, branchId }`

---

## 2. Metal Rates

### Server Action `updateMetalRate`
* **Access**: Owner, Admin, Manager
* **Input Schema (Zod)**:
```typescript
export const UpdateRateInputSchema = z.object({
  metal: z.enum(["GOLD", "SILVER", "PLATINUM"]),
  purityKey: z.string(), // "24K", "22K", "18K", "925"
  sellingRate: z.number().positive(),
  purchaseRate: z.number().positive(),
  effectiveAt: z.string().datetime().optional(),
});
```
* **Behavior**: Inserts a new record into `metal_rates` with timestamp; leaves historical rate records intact.

---

## 3. Inventory & Barcode

### Server Action `createStockItem`
* **Access**: Owner, Admin, Inventory Clerk
* **Input Schema (Zod)**:
```typescript
export const CreateStockItemSchema = z.object({
  productId: z.string().uuid(),
  barcode: z.string().min(4),
  sku: z.string().min(3),
  title: z.string().min(2),
  metal: z.enum(["GOLD", "SILVER", "PLATINUM"]),
  purityKey: z.string(),
  grossWeight: z.number().positive(),
  stoneWeight: z.number().nonnegative().default(0),
  otherDeductions: z.number().nonnegative().default(0),
  makingType: z.enum(["PERCENTAGE", "PER_GRAM", "FIXED"]),
  makingValue: z.number().nonnegative(),
  acquisitionCost: z.number().positive(),
  trayLocation: z.string().optional(),
  supplierId: z.string().uuid().optional(),
});
```
* **Behavior**: Validates uniqueness of barcode within `business_id`; computes `netWeight` ($Gross - Stone - Deductions$) and `fineGoldEq`; registers initial `StockMovement` as `IN_SHOWCASE`.

---

## 4. Sales & POS Billing

### Server Action `finalizeInvoice`
* **Access**: Owner, Admin, Manager, Salesperson
* **Input Schema (Zod)**:
```typescript
export const FinalizeInvoiceSchema = z.object({
  invoiceType: z.enum(["RETAIL_GST", "WHOLESALE_GST", "CASH_MEMO", "ESTIMATE"]),
  customerId: z.string().uuid().optional(),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    gstin: z.string().optional(),
    city: z.string().default("Jaipur"),
    address: z.string().optional(),
  }),
  items: z.array(z.object({
    stockItemId: z.string().uuid().optional(),
    description: z.string(),
    metal: z.enum(["GOLD", "SILVER", "PLATINUM"]),
    purityKey: z.string(),
    grossWeight: z.number().positive(),
    netWeight: z.number().positive(),
    metalRate: z.number().positive(),
    makingCharges: z.number().nonnegative(),
    stoneValue: z.number().nonnegative().default(0),
    discount: z.number().nonnegative().default(0),
    subtotal: z.number().positive(),
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "OLD_GOLD", "CREDIT"]),
    amount: z.number().positive(),
    referenceNo: z.string().optional(),
  })).min(1),
  oldGoldExchange: z.object({
    grossWeight: z.number(),
    netWeight: z.number(),
    purityPercent: z.number(),
    valuation: z.number(),
    description: z.string(),
  }).optional(),
});
```
* **Transaction Execution**:
  1. Verifies stock availability and locks items.
  2. Creates immutable invoice header and line items.
  3. Increments invoice counter prefix (e.g. `INV-2026-0842`).
  4. Updates each stock item to `status = 'SOLD'` with `StockMovement`.
  5. Records payments.
  6. Updates customer ledger balance.
  7. If old gold was tendered, creates reverse purchase voucher.
  8. Posts journal entries into accounts ledger.

---

## 5. Karigar Management

### Server Action `issueMetalToKarigar`
* **Input Schema (Zod)**:
```typescript
export const IssueMetalSchema = z.object({
  karigarId: z.string().uuid(),
  metal: z.enum(["GOLD", "SILVER", "PLATINUM"]),
  grossWeight: z.number().positive(),
  purity: z.string(),
  fineWeight: z.number().positive(),
  ornamentOrderName: z.string().min(2),
  notes: z.string().optional(),
});
```
* **Behavior**: Atomically logs `KarigarTransaction` (`ISSUE_METAL`) and increases `pureGoldBalanceGrams` for the artisan.
