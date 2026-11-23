# JewelleryOS · Testing Strategy & Quality Assurance

> **Verification Suite for Zero-Error Financial, Bullion, and Inventory Operations**

---

## 1. Test Layers & Philosophy

In a jewellery management system dealing with high-value physical inventory and strict statutory GST records, **testing business logic is non-negotiable**.

```
+--------------------------------------------------------+
|                END-TO-END WORKFLOW TESTS               |
|  Playwright: Full Billing Counter, Print Parchi, PWA   |
+--------------------------------------------------------+
                           |
+--------------------------------------------------------+
|               INTEGRATION TRANSACTION TESTS            |
|  Prisma Test DB: Stock Movements, Split Payments, RBAC |
+--------------------------------------------------------+
                           |
+--------------------------------------------------------+
|                 UNIT & ARITHMETIC TESTS                |
|  Vitest / TSX: Karat Math, Wastage, Saikda Interest    |
+--------------------------------------------------------+
```

---

## 2. Mandatory Test Matrix

| Test Scenario | Trigger | Expected Invariant | Status |
| :--- | :--- | :--- | :--- |
| **1. 18K @ 18% Making Pricing** | 10g 18K @ ₹1,50,000 / 10g | Final Subtotal must equal **₹1,32,750** exactly | ✅ Passing |
| **2. 22K @ 18% Making Pricing** | 10g 22K @ ₹1,50,000 / 10g | Final Subtotal must equal **₹1,62,250** exactly | ✅ Passing |
| **3. Harshit's Counter Equation** | 10g 18K + 6% wastage | Fine gold eq = 8.100g (₹1,21,500), customer price remains ₹1,32,750 | ✅ Passing |
| **4. Stone Weight Deduction** | 12.5g gross with 1.2g stone | Billable weight must be exactly 11.300g | ✅ Passing |
| **5. Silver Normalization** | 100g 925 silver @ ₹95,000 / kg | Exact gram-level price calculation | ✅ Passing |
| **6. Double-Selling Prevention** | Two terminals bill same barcode concurrently | Exactly one transaction succeeds; the other rolls back with 409 Conflict | 📋 Planned (M4) |
| **7. Rate Immutability** | Update today's 24K rate from ₹1.5L to ₹1.6L | Previous finalized invoices retain original historical rate snapshot | 📋 Planned (M2) |
| **8. Old-Gold Split Payment** | ₹1.5L sale with ₹50K old gold tender | Invoice records ₹50K old-gold payment + reverse purchase voucher created | 📋 Planned (M5) |
| **9. Karigar Metal Reconciliation**| Issue 100g pure gold, receive 95g with 2% ghat | Artisan pure gold balance updates to exactly 3.000g remaining | 📋 Planned (M6) |
| **10. Daily Cash Closing Balance** | Opening cash + cash sales - cash expenses | System expected cash matches manual cashier tally within tolerance | 📋 Planned (M6) |

---

## 3. Running Current Tests

The project currently executes native TypeScript acceptance tests via Node.js test runner / `tsx`:

```bash
# Run all pricing engine acceptance tests
npm test
```

### Current Test Coverage Results
```
▶ JewelleryOS Financial Pricing Engine Acceptance Tests
  ✔ Test 1: 10g, 18K, ₹1,50,000/10g, 0% making => ₹1,12,500
  ✔ Test 2: 10g, 18K, ₹1,50,000/10g, 18% making => ₹1,32,750
  ✔ Test 3: 10g, 18K, ₹1,50,000/10g, ₹500/g making => ₹1,17,500
  ✔ Test 4: 10g, 22K (150000 / 24 * 22), no making => ₹1,37,500
  ✔ Test 4b (From Harshit's Shop Notebook): 10g 22K with 18% making => ₹1,62,250
  ✔ Test 5: 10g, 23K at 95.8333%, no making => Approximately ₹1,43,750
  ✔ Test 6: Zero or negative weight validated appropriately
  ✔ Test 7: Missing rate is marked incomplete or blocked
  ✔ Test 8: Stone deduction reduces billable weight correctly
  ✔ Test 9: Cost wastage does NOT silently change customer selling price
  ✔ Test 10: Silver calculator with per_kg normalization and 925 purity
  ✔ Test 11: Gross profit and gross margin arithmetic is exact
  ✔ Test 12: Harshit's Counter Formula: 10g 18K + 6% wastage => 81% fine (8.1g @ 24K rate = ₹1,21,500), customer price remains ₹1,32,750
✔ 13 tests passed (100% success)
```
