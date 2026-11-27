---
name: jewellery-qa
description: Test strategy, precision math verification, inventory reconciliation, and cross-tenant security test suites.
---

# Jewellery ERP Quality Assurance & Testing Skill

## 1. Test Verification Strategy
Testing a financial jewellery ERP requires rigorous verification across four primary dimensions:
1. **Mathematical & Precision Correctness:** Zero floating-point rounding errors across complex making charges, stone deductions, and fine metal ratios.
2. **Tax & Statutory Compliance:** Accurate CGST/SGST/IGST splits, PAN requirement threshold triggers at ₹2,00,000, and cash receipt restriction warnings.
3. **Multi-Tenant Security Isolation:** Verifying that no tenant can read, modify, or leak another tenant's records.
4. **Offline Resilience & Stock Reconciliation:** Proving that pending transactions sync cleanly without duplicates or data loss.

---

## 2. Mandatory Test Suite Checklist

| Suite | Description | Key Assertions |
| :--- | :--- | :--- |
| `jewelleryMath.test.ts` | Weight & purity math | Net weight, fine gold equivalent, stone weight deduction. |
| `pricingEngine.test.ts` | POS pricing calculations | Metal value, making charge (%, per-gram, fixed), discounts, round-off. |
| `taxCompliance.test.ts` | Indian tax rules | GST 3% calculation, Section 262 PAN trigger at ₹2,00,000, Section 269ST cash limit. |
| `multiTenantIsolation.test.ts` | Security boundary | Tenant B cannot access Tenant A's products, stock, invoices, or customers. |
| `karigarLedger.test.ts` | Goldsmith work-orders | Pure gold issued, finished ornament received, scrap returned, net wastage balance. |
| `girviLoan.test.ts` | Pawnbroking math | Monthly simple interest, principal repayment, pledge release state machine. |
| `offlineSync.test.ts` | Edge billing & sync | Idempotency key deduplication, outbox processing, provisional invoice mapping. |

---

## 3. Pre-Commit Execution Protocol
Always run the complete automated test suite before committing code:
```bash
npm test
```
Every test must pass with **0 failures** across all suites.
