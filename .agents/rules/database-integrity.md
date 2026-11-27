# Database Integrity & Transactional Invariants

## 1. ACID Transactions & Atomic Operations
Jewellery ERP operations often touch multiple financial and stock ledgers simultaneously. A failure midway through an operation can cause irreparable ledger mismatch or stock ghosting.

### Mandatory `prisma.$transaction`:
Any operation modifying more than one table **MUST** be wrapped in an atomic interactive transaction:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Deduct stock item status
  // 2. Insert invoice record
  // 3. Record payment entries
  // 4. Update customer balance
  // 5. Insert double-entry journal entries
  // 6. Append stock movement audit log
});
```

---

## 2. Stock Movement Audit Logging
- Every change in a physical stock item's status (e.g., `IN_SHOWCASE` -> `SOLD`, `IN_VAULT` -> `WITH_KARIGAR`, `IN_SHOWCASE` -> `ON_MEMO`) **MUST append an immutable row** to `stock_movements`.
- The audit record must capture:
  - `stockItemId`
  - `fromStatus` & `toStatus`
  - `reason` (e.g., "Sale Invoice INV-2026-0042", "Memo Approval MEMO-108")
  - `referenceType` & `referenceId`
  - `timestamp`
  - `performedById`

---

## 3. Double-Entry Accounting Invariant
- Every financial transaction that touches accounting ledgers must generate balanced `JournalEntry` and `JournalLine` records.
- **The Golden Invariant:**
  $$\sum \text{Debits} \equiv \sum \text{Credits}$$
- If debits do not equal credits down to the exact paise (2 decimal places), the transaction must abort and roll back.

---

## 4. Referential Integrity & Cascade Prevention
- **Financial Masters:** Never use `onDelete: Cascade` on `products`, `customers`, `suppliers`, `invoices`, or `stockItems`.
- **Soft Delete / Status Transition:** When an item is sold, melted, or returned, update its `status` rather than deleting the database row.
- Historic sales invoices must retain their historical line items, pricing, weight, and customer details permanently for statutory tax audit purposes.
