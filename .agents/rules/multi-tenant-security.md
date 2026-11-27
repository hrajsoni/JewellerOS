# Multi-Tenant Security & Data Protection Rules

## 1. Core Security Invariants
- **Multi-Tenant Logical Isolation:** JewelBill hosts multiple jewellery merchants on a single database. A data breach between two competing jewellers is catastrophic.
- **Zero Cross-Tenant Leakage:** No tenant must EVER be able to query, infer, count, or modify another tenant's inventory, customer lists, financial ledgers, or metal rates.

---

## 2. Authentication & Session Verification
- All authenticated routes must verify the active JWT session cookie (`jewellery_session`).
- The session payload contains:
  ```typescript
  interface SessionPayload {
    userId: string;
    businessId: string;
    branchId?: string | null;
    role: RoleType;
  }
  ```
- **Never trust client-supplied `businessId`**: Always extract `businessId` from the verified session payload, never from the request body or query parameter.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Capability / Action | OWNER | ADMIN | MANAGER | ACCOUNTANT | SALESPERSON | INVENTORY_CLERK |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| POS Billing & Invoicing | Yes | Yes | Yes | Read Only | Yes | No |
| Price Overrides & Discounts | Yes | Yes | Limited | No | No | No |
| Stock Creation & Editing | Yes | Yes | Yes | No | No | Yes |
| Stock Status Change (Vault/Memo) | Yes | Yes | Yes | No | No | Yes |
| Karigar Settlement & Wastage | Yes | Yes | Yes | No | No | No |
| Girvi Loan Issuance & Release | Yes | Yes | Yes | No | No | No |
| Financial Ledger & Roznamcha | Yes | Yes | Yes | Yes | No | No |
| Tax Reports (GSTR-1, GSTR-3B) | Yes | Yes | Yes | Yes | No | No |
| Daily Cash Reconciliation | Yes | Yes | Yes | Yes | Submit Own | No |
| Showroom Master & Metal Rates | Yes | Yes | No | No | No | No |
| User & Staff Management | Yes | Yes | No | No | No | No |

---

## 4. API Request Validation & Sanitization
- All request payloads must be validated using `zod` schemas before executing any business logic.
- Strip unknown or unexpected parameters to prevent prototype pollution or unauthorized privilege escalation.
- Passwords must be hashed using `bcryptjs` with a work factor of at least 10 salt rounds.
