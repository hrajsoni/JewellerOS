# JewelBill SaaS Definition & Product Architecture

## 1. Core Platform Identity
**JewelBill** (internally codebase-named `jewellery-os`) is a **B2B Multi-Tenant Software-as-a-Service (SaaS) Enterprise Resource Planning (ERP) platform** engineered specifically for jewellery manufacturers, wholesalers, and retail showroom merchants.

### STRICT NEGATIVE INVARIANTS:
- **JewelBill is NOT a public jewellery retail store, e-commerce shop, or direct-to-consumer (D2C) marketplace.**
- **NEVER generate public shopping carts, consumer checkout flows, consumer-facing product browsing, or SEO product catalog landing pages.**
- **NEVER confuse the Subscriber (Merchant/Jeweller) with the Retail Customer (the individual buying ornaments in the jeweller's shop).**

---

## 2. Three Distinct Product Surfaces

```
+-----------------------------------------------------------------------------------+
|                                JEWELBILL PLATFORM                                 |
+-----------------------------------------------------------------------------------+
| 1. PUBLIC SAAS WEBSITE          | 2. AUTHENTICATED MERCHANT ERP | 3. SUPER ADMIN  |
| - Marketing & Features Overview | - POS Billing & Invoicing     | - Tenant Mgmt   |
| - Tiered Pricing Plans (SaaS)   | - Inventory & Stock Vault     | - Subscriptions |
| - Jeweller Self-Registration    | - Metal Rates & Bullion       | - Usage Quotas  |
| - Merchant Onboarding & Trial   | - Karigar Job Cards & Ledger  | - System Health |
| - Platform Documentation        | - Girvi / Pawnbroking         | - Audit Logs    |
|                                 | - Roznamcha / Accounts / GST  |                 |
+-----------------------------------------------------------------------------------+
```

### Surface 1: Public JewelBill SaaS Website
- **Target Audience:** Jewellery business owners, showroom managers, chain operators seeking ERP software.
- **Key Functions:**
  - Landing pages, feature highlights (POS, Girvi, Karigar, BIS Hallmark compliance).
  - Subscription pricing tiers (e.g., Starter, Professional, Enterprise).
  - Merchant registration, phone/email OTP verification, and automated tenant provisioning.
  - Merchant login entry point.

### Surface 2: Authenticated Merchant ERP Application
- **Target Audience:** Showroom owners, store managers, cashiers, sales staff, inventory clerks, and accountants.
- **Key Functions:**
  - Rapid POS billing with barcode scanner support, old gold exchange, and GST invoicing.
  - Multi-tier product catalogue, inventory tracking, tray locations, and physical stock audits.
  - Karigar / Artisan goldsmith lifecycle (pure gold issued, finished ornaments received, wastage settlement).
  - Girvi / Pawnbroking loan management with interest calculation and legal notice generation.
  - Customer CRM, Udhar (credit) ledger, advance booking, and loyalty.
  - Supplier purchases, stock intake, and bullion settlement.
  - Financial accounting: Roznamcha (daily cash book), Double-Entry General Ledger, GST-ready GSTR-1/GSTR-3B summaries.

### Surface 3: JewelBill Super Admin Platform
- **Target Audience:** JewelBill platform engineering and operations team.
- **Key Functions:**
  - Tenant (Business) management: provisioning, suspension, activation.
  - SaaS subscription billing, plan enforcement, feature flags, and add-on modules.
  - Platform-wide storage and database usage monitoring.
  - Global audit logs and support troubleshooting (with zero unauthorized access to merchant financial ledger records).

---

## 3. Entity Separation & Terminology

| Entity | Definition | Database Table | Context |
| :--- | :--- | :--- | :--- |
| **Merchant / Business** | The paying jewellery business subscribing to JewelBill. | `businesses` | Tenant boundary for all ERP data. |
| **Branch / Showroom** | A physical showroom or vault location owned by a Merchant. | `branches` | Multi-store inventory and billing. |
| **User / Staff** | An employee or owner of the Merchant working in the ERP. | `users` | Authenticated actor with RBAC roles. |
| **Retail Customer** | An individual walking into the merchant's store to buy jewellery or take a loan. | `customers` | Merchant's client (strictly isolated per business). |
| **Supplier** | A bullion dealer, wholesaler, or findings manufacturer. | `suppliers` | Merchant's vendor. |
| **Karigar** | A contracted goldsmith or workshop manufacturing jewellery. | `karigars` | Artisan job-work partner. |
