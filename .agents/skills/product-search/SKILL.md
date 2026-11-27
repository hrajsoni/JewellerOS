---
name: product-search
description: Multi-attribute faceted search, PostgreSQL B-tree and trigram indexing, instant barcode lookup, and command palette navigation.
---

# Product Search & Indexing Skill

## 1. Multi-Attribute Search Dimensions
In a jewellery showroom with thousands of ornaments, staff must find items instantaneously using various queries:
- **Barcode / Serial Lookup:** Exact match (e.g. `JW-00018452`). Instant $O(1)$ response.
- **BIS HUID Lookup:** Exact match (e.g. `H7K9L2`).
- **Product Code / SKU:** Prefix and fuzzy match (e.g. `RNG-22K-001`).
- **Faceted Attributes:**
  - Metal: `GOLD`, `SILVER`, `PLATINUM`.
  - Purity: `24K`, `22K`, `18K`, `14K`, `925`.
  - Category: `Rings`, `Bangles`, `Chains`, `Necklaces`.
  - Weight Range: Min weight $\le \text{Net Wt} \le$ Max weight (e.g., rings between 3.5g and 5.0g).
  - Status: `IN_SHOWCASE`, `IN_VAULT`, `WITH_KARIGAR`, `ON_MEMO`.
  - Location: Tray / Showcase identifier (e.g., `Tray-G12`).

---

## 2. PostgreSQL Indexing Strategy
To ensure sub-50ms query times over tens of thousands of items per tenant:
1. **Multi-Tenant Composite Indexes:**
   - `@@index([businessId, barcode])` -> Instant scanner lookup.
   - `@@index([businessId, huid])` -> Statutory hallmark check.
   - `@@index([businessId, status, category])` -> Showroom catalog browsing.
   - `@@index([businessId, metal, purityKey])` -> Valuation and rate updates.
2. **Trigram & Full-Text Indexing (`pg_trgm`):**
   - For fuzzy matching on titles, descriptions, and supplier item references.
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX idx_stock_items_trgm_title ON stock_items USING gin (title gin_trgm_ops);
   ```

---

## 3. Keyboard-Driven Command Palette (`cmdk`)
- Global hotkey `Ctrl+K` / `Cmd+K` opens the rapid finder.
- Allows immediate switching between:
  - Scanning an item to add to the active POS cart.
  - Looking up a customer by phone number.
  - Viewing live metal rates.
  - Navigating to Karigar ledger or Roznamcha.
