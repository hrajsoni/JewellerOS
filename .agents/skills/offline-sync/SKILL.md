---
name: offline-sync
description: Durable offline billing architecture, Dexie.js IndexedDB local storage, transactional outbox pattern, and conflict resolution.
---

# Offline Sync & Edge Billing Skill

## 1. Architecture: Why LocalStorage Fails for Financial ERPs
`localStorage` is synchronous, blocked by the main UI thread, capped at ~5MB, vulnerable to browser tab crashes, and offers no transactional rollback. In contrast, **IndexedDB (via Dexie.js)** provides:
- Fully asynchronous, durable, multi-megabyte structured storage.
- Atomic multi-table transactions in the browser.
- Background persistence during network dropouts.

---

## 2. The Transactional Outbox Pattern

```
+-----------------------------------------------------------------------------------+
| CLIENT BROWSER (Dexie.js IndexedDB)                                               |
|                                                                                   |
|  [POS Invoice Created] ---> [Local Invoices Table] (Status: PENDING_SYNC)         |
|                                     |                                             |
|                                     v                                             |
|                         [Sync Outbox Queue Table]                                 |
|                         - id: uuid                                                |
|                         - idempotencyKey: "idem_91823..."                         |
|                         - payload: { invoice, stockDeduction, payment }           |
|                         - attempts: 0, status: "QUEUED"                           |
+-----------------------------------------------------------------------------------+
                                      |
                     [Sync Service / Web Worker Poll]
                                      |
                                      v
+-----------------------------------------------------------------------------------+
| SERVER (Next.js API & Neon PostgreSQL)                                           |
|                                                                                   |
|  1. Verify Idempotency Key (If already processed, return existing invoice).       |
|  2. Atomic $transaction: Validate stock -> Deduct -> Insert Invoice -> Ledger.    |
|  3. Return HTTP 200 { synced: true, officialInvoiceNumber: "INV-2026-0042" }.     |
+-----------------------------------------------------------------------------------+
```

---

## 3. Conflict Resolution Strategy
- **Master Data (Rates, Products):** Server-wins. Local client re-syncs to central master data when reconnecting.
- **Stock Collision (Piece Sold Concurrently):**
  - If Terminal A sold `JW-00018452` offline at 11:02 AM, and Terminal B sold it online at 11:01 AM:
  - Terminal A's outbox item flags `CONFLICT_STOCK_UNAVAILABLE`.
  - An administrative alert is displayed to the store manager with physical reconciliation steps.
- **Provisional Offline Invoice Numbers:**
  - Client generates provisional number: `PROV-BRANCH1-REG2-0042`.
  - On sync, server assigns official sequential tax invoice number `INV-2026-0089` and maintains a permanent bidirectional cross-reference.
