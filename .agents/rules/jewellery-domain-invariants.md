# Jewellery Domain Invariants & Business Logic

## 1. 5-Tier Product Identity Hierarchy

In a professional jewellery ERP, a **design** is fundamentally distinct from an **individual physical ornament**. One design may have 50 rings in stock, but each ring possesses its own physical weight, stone setting, acquisition cost, tray location, and unique hallmark.

| Tier | Identifier | Format / Example | Scope & Purpose |
| :--- | :--- | :--- | :--- |
| **Tier 1: Product ID** | Internal UUID / CUID | `cly1abcde0001...` | System primary key, immutable, internal relational linking. |
| **Tier 2: Product Code** | Human-Readable Design Code | `RNG-22K-001`, `NL-ANT-042` | Identifies a specific design or model in the catalogue. |
| **Tier 3: SKU** | Sellable Variant Identity | `RNG-22K-001-SZ18` | Identifies design + purity + size/color variation. |
| **Tier 4: Item ID / Barcode** | Physical Piece Serial | `JW-00018452` | Unique physical barcode on the tag affixed to the exact ornament. |
| **Tier 5: BIS HUID** | Statutory Hallmark Code | `A1B2C3` (6 alphanumeric chars) | Unique identification assigned by Bureau of Indian Standards Assaying Centre. |

### Identity Invariants:
- **Design vs Piece Separation:** Never store physical weight or stock status on the `Product` (Design) model. Physical weight and stock status belong exclusively to `StockItem` (Piece).
- **Dual Barcode Capability:** Support both:
  1. Unique per-piece barcodes (serialized ornaments).
  2. Barcode per SKU/design (standard fast-moving findings, bullion coins, or low-cost silver items).

---

## 2. Weight & Arithmetic Precision Invariants

### Zero-Float Rule:
- **NEVER** use standard JavaScript floating-point numbers (`number`) for jewellery weights, purity percentages, making charges, or currency.
- **ALWAYS** use `decimal.js` (`Decimal`) with explicit rounding modes (`Decimal.ROUND_HALF_UP`).

### Precision Standards:
- **Metal Weights:** Exactly 3 decimal places (milligrams, e.g., `12.450 g`).
- **Purity Percentages:** Exactly 4 decimal places (e.g., `0.9167` for 22K Gold).
- **Currency & Money:** Exactly 2 decimal places (e.g., `₹75,420.50`).
- **Exchange Rates & Karat Ratios:** Minimum 4 decimal places.

### Core Calculation Formulas:
1. **Net Weight:**
   $$\text{Net Weight} = \text{Gross Weight} - \text{Stone Weight} - \text{Other Deductions}$$
2. **Pure Gold Equivalent (Fine Weight):**
   $$\text{Fine Metal Weight} = \text{Net Weight} \times \left(\frac{\text{Purity Percentage}}{100}\right)$$
3. **Metal Value (Gold):**
   $$\text{Metal Value} = \text{Net Weight} \times \left(\frac{\text{Effective Selling Rate per 10g}}{10}\right)$$
4. **Metal Value (Silver):**
   $$\text{Metal Value} = \text{Net Weight} \times \left(\frac{\text{Effective Selling Rate per 1kg}}{1000}\right)$$
5. **Making Charges:**
   - **Percentage:** $\text{Metal Value} \times \left(\frac{\text{Making \%}}{100}\right)$
   - **Per Gram:** $\text{Gross Weight} \times \text{Rate per Gram}$
   - **Fixed:** Explicit rupee amount.

---

## 3. Regulatory & Statutory Compliance (India)

### A. Income Tax Act 2025 (Replacing 1961 Act from 1 April 2026)
- **High-Value Transaction PAN Rule:** Under **Section 262** of the Income-tax Act, 2025 and **Rule 159** of the Income-tax Rules, 2026 (formerly Section 139A of the 1961 Act), PAN is mandatory for any sale or purchase of jewellery where transaction value exceeds **₹2,00,000**.
- **Section 269ST Cash Limit:** No person shall receive cash equal to or exceeding **₹2,00,000** in aggregate from a person in a day or in respect of a single transaction. The POS billing engine must restrict or trigger mandatory compliance warnings on cash tenders $\ge ₹2,00,000$.

### B. Goods and Services Tax (GST)
- **Finished Jewellery:** Standard rate is **3%** (CGST 1.5% + SGST 1.5% for intra-state; IGST 3% for inter-state).
- **Making Charges on Retail Sale:** Making charges are bundled into the principal supply of jewellery and taxed at the composite **3%** GST rate.
- **Job Work by Registered Karigar:** Taxed separately at **5%** GST.
- **HSN Codes:**
  - `7113`: Articles of jewellery and parts thereof, of precious metal.
  - `7108`: Gold (including gold plated with platinum) unwrought or in semi-manufactured forms.
  - `7102`: Diamonds, whether or not worked, but not mounted or set.

### C. BIS Hallmarking & HUID
- **HUID Format:** Strictly a **6-character alphanumeric** identifier (e.g., `A1B2C3`), uppercase letters and digits.
- **Mandatory Hallmarking:** Enforced across notified districts of India for 14K, 18K, 20K, 22K, 23K, and 24K gold ornaments.
