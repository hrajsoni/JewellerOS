---
name: jewellery-domain
description: Core jewellery math, hallmarking, metals, and regulatory compliance standards for the Indian market.
---

# Jewellery Domain Skill

## 1. Karatage & Purity Conversion Standards

| Metal & Karat | Fineness / Purity % | Multiplier | BIS Hallmark Stamp |
| :--- | :--- | :--- | :--- |
| **Gold 24K** | 99.9% / 999.0 parts | 0.9990 | 999 |
| **Gold 22K** | 91.67% / 916.0 parts | 0.9167 | 916 |
| **Gold 20K** | 83.33% / 833.0 parts | 0.8333 | 833 |
| **Gold 18K** | 75.00% / 750.0 parts | 0.7500 | 750 |
| **Gold 14K** | 58.33% / 585.0 parts | 0.5833 | 585 |
| **Gold 9K** | 37.50% / 375.0 parts | 0.3750 | 375 |
| **Silver 999** | 99.9% fine silver | 0.9990 | 999 Fine Silver |
| **Silver 925** | 92.50% sterling silver | 0.9250 | 925 Sterling |
| **Silver 800** | 80.00% utensil/payal grade| 0.8000 | 800 |

---

## 2. Weight Calculations & Fine Metal Arithmetic

```typescript
import { Decimal } from 'decimal.js';

// Net Weight Calculation
export function calculateNetWeight(
  grossWeight: Decimal.Value,
  stoneWeight: Decimal.Value = 0,
  otherDeductions: Decimal.Value = 0
): Decimal {
  const gross = new Decimal(grossWeight);
  const stone = new Decimal(stoneWeight);
  const ded = new Decimal(otherDeductions);
  return gross.minus(stone).minus(ded).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

// Fine Gold Equivalent (24K pure equivalent)
export function calculateFineMetalEquivalent(
  netWeight: Decimal.Value,
  purityPercent: Decimal.Value
): Decimal {
  const net = new Decimal(netWeight);
  const purity = new Decimal(purityPercent);
  return net.mul(purity).div(100).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
```

---

## 3. Statutory & Indian Regulatory Invariants
1. **Income Tax Act 2025 Section 262 & Rule 159 (formerly 1961 Act Sec 139A):**
   - Threshold: Mandatory PAN capture for jewellery sales or purchases $\ge ₹2,00,000$.
2. **Section 269ST Cash Tender Restriction:**
   - Absolute statutory restriction against taking $\ge ₹2,00,000$ in cash from any customer in a single day/transaction.
3. **Goods & Services Tax (GST):**
   - Finished Jewellery Sales: 3% composite rate (1.5% CGST + 1.5% SGST or 3% IGST).
   - Karigar Job-Work: 5% service GST.
4. **BIS Hallmarking & HUID:**
   - Bureau of Indian Standards HUID is a mandatory 6-character alphanumeric code (e.g., `A1B2C3`).
