# JewelleryOS · Business Rules & Domain Formulas

> **Verified Indian Bullion, Karatage, Taxation, and Accounting Specification**  
> Every equation defined here is binding across both frontend terminals and backend services.

---

## 1. Metal Purity & Karatage Standards

In Indian bullion markets, Gold purity is legally defined by the **Bureau of Indian Standards (BIS)** and expressed in parts per 24 or fineness per 1,000:

| Karat | Fineness | Fraction | Decimal Factor | Usage / Hallmarking |
| :--- | :--- | :--- | :--- | :--- |
| **24K** | 999 / 1000 | $24 / 24$ | `1.0000` | Sovereign Coins, Raw Bullion Bars |
| **23K** | 958 / 1000 | $23 / 24$ | `0.95833` | Special Temple Jewellery |
| **22K** | 916 / 1000 | $22 / 24$ | `0.91667` | Standard Indian Hallmarked Gold |
| **18K** | 750 / 1000 | $18 / 24$ | `0.75000` | Diamond-Studded & Polki Jewellery |
| **14K** | 585 / 1000 | $14 / 24$ | `0.58333` | Lightweight Daily Wear / Solitaires |
| **9K** | 375 / 1000 | $9 / 24$ | `0.37500` | Export Jewellery |

### Purity Rate Derivation Rule
Given a 24K Board Rate $R_{24}$ per 10g:
$$\text{Rate per gram (24K)} = \frac{R_{24}}{10}$$
$$\text{Rate per gram (K-Karat)} = \left(\frac{R_{24}}{10}\right) \times \left(\frac{K}{24}\right)$$

---

## 2. Retail Customer Selling Price vs Harshit's Shop Fine Gold Equation

### Rule A: Customer Invoice Selling Price
$$\text{Billable Weight} = \text{Gross Weight} - \text{Stone Deduction}$$
$$\text{Metal Value} = \text{Billable Weight} \times \text{Rate per gram}(K)$$

$$\text{Making Charges} = \begin{cases} 
\text{Metal Value} \times \left(\frac{\text{Making \%}}{100}\right) & \text{if Percentage} \\
\text{Billable Weight} \times \text{Making Rate per gram} & \text{if Per Gram} \\
\text{Fixed Amount} & \text{if Fixed}
\end{cases}$$

$$\text{Subtotal Before Tax} = \text{Metal Value} + \text{Making Charges} + \text{Stone Value} - \text{Discount}$$
$$\text{Taxable Amount} = \text{Subtotal Before Tax}$$
$$\text{GST Amount (3\% Total)} = \text{Taxable Amount} \times 0.03 \quad (\text{CGST } 1.5\% + \text{SGST } 1.5\%)$$
$$\text{Final Customer Price} = \text{Taxable Amount} + \text{GST} + \text{RoundOff}$$

#### Tested & Verified Benchmarks
* **10g 18K @ 18% Making (₹1,50,000 / 10g base)**:
  $$\text{Metal Value} = 10 \times (15000 \times 0.75) = ₹1,12,500$$
  $$\text{Making Charges} = ₹1,12,500 \times 18\% = ₹20,250$$
  $$\text{Subtotal (Customer Price)} = ₹1,12,500 + ₹20,250 = \mathbf{₹1,32,750}$$

* **10g 22K @ 18% Making (₹1,50,000 / 10g base)**:
  $$\text{Metal Value} = 10 \times (15000 \times 22/24) = 10 \times 13750 = ₹1,37,500$$
  $$\text{Making Charges} = ₹1,37,500 \times 18\% = ₹24,750$$
  $$\text{Subtotal (Customer Price)} = ₹1,37,500 + ₹24,750 = \mathbf{₹1,62,250}$$

### Rule B: Harshit's Counter Equation (Internal Fine Gold Accounting)
When an artisan or workshop quotes manufacturing wastage (e.g. 6% wastage on 18K):
$$\text{Effective Purity \%} = \text{Base Purity (75\%)} + \text{Wastage (6\%)} = 81\%$$
$$\text{Fine Gold Eq (24K)} = \text{Billable Weight } (10\text{g}) \times 81\% = 8.100\text{g}$$
$$\text{Fine Gold Equivalent Value} = 8.100\text{g} \times ₹15,000/\text{g} = \mathbf{₹1,21,500}$$
$$\text{Shop Gross Margin} = \text{Customer Price } (₹1,32,750) - \text{Fine Gold Eq } (₹1,21,500) = \mathbf{₹11,250}$$

*Crucial System Rule*: Internal wastage $\%$ and Fine Gold Equivalents must **never silently overwrite customer selling price**. They are preserved in the database for cost-of-goods-sold (COGS) and artisan settlement.

---

## 3. Old Gold Exchange (Dual-Transaction Rule)

Under GST and Indian commercial law, exchanging old gold is **not** a simple price markdown. It comprises two distinct legal actions:
1. **Purchase Entry (Reverse Transaction)**:
   * Purchase Voucher generated with customer KYC (Aadhaar/PAN).
   * Gross weight, melt loss, stone weight deduction recorded.
   * Net pure gold assessed and valued at current *Purchase Board Rate*.
2. **Sales Invoice Entry**:
   * New jewellery billed at full gross value and GST.
   * Old Gold value applied as a **Payment Tender (Method: `OLD_GOLD`)**.

*Example*:
* New Jewellery Invoice Total: ₹1,50,000 (Taxable ₹1,45,631 + GST ₹4,369)
* Old Gold Valuation Voucher #OG-102: ₹50,000
* Payment Tender 1 (`OLD_GOLD`): ₹50,000 (Allocated to Invoice)
* Payment Tender 2 (`UPI`): ₹1,00,000
* Balance Due: ₹0

---

## 4. Girvi & Pawn Brokering (Monthly Saikda Interest Rule)

Traditional Indian jeweller pawn loans operate on a **monthly saikda** (प्रति सैकड़ा ब्याज):
$$\text{Monthly Interest Rate } (r) = \text{e.g. } 1.5\% \text{ per month}$$
$$\text{Monthly Rupee Interest} = \text{Principal } (P) \times \left(\frac{r}{100}\right)$$

### Pro-Rata Accrual Formula
$$\text{Elapsed Days} = \text{Current Date} - \text{Loan Start Date}$$
$$\text{Elapsed Months (Decimal)} = \frac{\text{Elapsed Days}}{30}$$
$$\text{Accrued Simple Interest} = P \times \left(\frac{r}{100}\right) \times \left(\frac{\text{Elapsed Days}}{30}\right)$$
$$\text{Total Price to Redeem Today} = P + \text{Accrued Interest} - \text{Principal Repaid}$$

---

## 5. Karigar Ghat & Metal Reconciliation

When pure bullion is issued to an artisan for ornament manufacturing:
1. **Issue Metal**: Pure 24K bullion is weighed and debited to the Karigar's bullion ledger.
2. **Receive Ornament**: Finished ornament is weighed. 
   $$\text{Pure Metal Returned} = \text{Net Weight} \times \left(\frac{\text{Ornament Karat}}{24}\right)$$
3. **Agreed Ghat (Allowed Cutting Loss)**:
   $$\text{Allowed Ghat} = \text{Gross Weight} \times \left(\frac{\text{Allowed Wastage \%}}{100}\right)$$
4. **Closing Metal Balance**:
   $$\text{Karigar Balance} = \text{Issued Pure Gold} - (\text{Returned Pure Gold} + \text{Allowed Ghat})$$

---

## 6. Daily Cash Closing Rule (रोकड़ मिलान)

At the conclusion of each business day, the cashier/owner must perform a cash reconciliation:
$$\text{System Expected Cash} = \text{Opening Cash} + \text{Cash Sales} + \text{Cash Receipts} - (\text{Cash Purchases} + \text{Cash Expenses} + \text{Staff Advances})$$
$$\text{Variance} = \text{Physical Counted Cash} - \text{System Expected Cash}$$

If $\text{Variance} \neq 0$, the closing cannot be approved without recording an explanatory reason and supervisor authorization.
