# JewellerOS 💎

> **The Next-Generation Retail Operating System for Indian Jewellery Showrooms & Goldsmiths**  
> Engineered with an Obsidian Liquid Glass aesthetic, verified Indian bullion arithmetic, multi-tenant partition privacy, and complete showroom management.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passed-emerald)](https://github.com/hrajsoni/JewellerOS)
[![Deployment](https://img.shields.io/badge/Vercel-Ready-black?style=flat&logo=vercel)](https://vercel.com)

---

## 🌟 Overview

**JewellerOS** is purpose-built for Indian jewellers to replace outdated pen-and-paper registers and rigid legacy desktop systems. It provides an all-in-one platform for counter sales estimation, GST billing, bullion weight tracking, pawn-brokering (*Girvi* loans), artisan (*Karigar*) ledgers, and staff payroll.

Default configured for **Sandhya Jewellers** (Jaipur, Rajasthan), JewellerOS supports unlimited isolated multi-tenant jewellery businesses with isolated local data partitions.

---

## ✨ Core Modules & Features

### 1. 🧮 Counter Pricing Terminal (काउंटर टर्मिनल)
* **Exact Fractional Karat Ratios**: Precise math based on pure gold content ($K/24$):
  * **24K**: 100% pure bullion
  * **22K**: 91.667% (916 Hallmarked)
  * **18K**: 75.000% (750 Hallmarked)
  * **14K**: 58.333% (585 Hallmarked)
* **Harshit's Shop Formula**:
  * $10\text{g } 18\text{K } @\text{ ₹}1,50,000/10\text{g} + 18\%\text{ making} = \mathbf{₹1,32,750}$
  * $10\text{g } 22\text{K } @\text{ ₹}1,50,000/10\text{g} + 18\%\text{ making} = \mathbf{₹1,62,250}$
  * Internal 24ct fine gold equation: $10\text{g} \times 75\% + 6\%\text{ wastage} = 8.1\text{g fine gold} = \mathbf{₹1,21,500}$.
* **Privacy Shield Eye Mode**: Instantly hides internal equations, 24ct fine gold weights, and margins when a customer is standing across the counter.
* **Smart Round-Off Chips**: 1-click rounding to nearest ₹100, ₹500, or ₹1,000.
* **1-Click WhatsApp Estimate**: Direct quote formatting sent to customer's WhatsApp mobile number.
* **Quick Cart Drawer**: Split payments (Cash + UPI + Card) and instant cash bill generation.

### 2. 🏛️ Girvi & Gold Loan Book (गिरवी / रेहन खाता)
* **Prominent Money Lent Display**: Explicit aggregate cards for **Money Lent (कुल दिया गया कर्ज / Principal)**, Accrued Monthly Saikda Interest, Total Redemption Price, and Vault Pledged Gold.
* **Multi-Facet Search & Filter**: Real-time search by borrower name, city, mobile number, packet number (`PKT-101`), and loan voucher number (`GRV-2026-001`).
* **Multi-Sort & Date Filters**: Sort by Date, Money Lent (High to Low), Accrued Interest, or Total Price across All Time, Last 30 Days, Last 3 Months, or Last 6 Months.
* **Form 7 Pledge Voucher (गिरवी पर्ची)**: Statutory pawn parchi preview with tamper-proof packet tag, safe location (`Tijori #1, Dabba #A`), and borrower signature blocks.
* **Mobile-Optimized Cards**: Clean mobile cards with tap-to-call borrower phone buttons (`tel:`).

### 3. 🔨 Karigar & Artisan Bullion Ledger (कारीगर खाता)
* **Artisan Directory**: Bengali master craftsmen, Kundan setting artists, and local goldsmiths.
* **Bullion Custody Ledger**: Issue raw 24K bullion, receive finished ornaments, and track *ghat* (cutting loss/wastage).
* **Live Gold Balance**: Tracks net pure gold balance held in the artisan's workshop.
* **Labour Register**: Track making charges due and disburse partial or complete cash payouts.

### 4. 👥 Showroom Staff & Payroll (स्टाफ व वेतन)
* **Counter Roster**: Counter salesmen, vault custodians, and billing staff.
* **Rokad Advance (पेशगी)**: Track cash advances issued throughout the month.
* **Salary Disbursal**: Automated net salary calculation deducting unrecovered cash advances.

### 5. 🔒 Multi-Tenant Privacy & Isolation
* **Zero Data Cross-Contamination**: Multi-tenant key partitioning (`jewellery_os_tenant_${tenantId}_*`).
* **Showroom Switcher**: Seamless switching between different showrooms or register a new store with GSTIN, BIS Hallmark license, and custom board rates.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
* **UI & Animations**: [Tailwind CSS v4](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Math Precision**: [Decimal.js](https://mikemcl.github.io/decimal.js/) (eliminates floating-point rounding errors in financial transactions)
* **Architecture**: Mobile-First, Responsive Dual-View Layouts (Desktop High-Density Table + Mobile Touch Cards)

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.18+ or 20+
* npm or pnpm or yarn

### Installation

```bash
# 1. Clone repository
git clone https://github.com/hrajsoni/JewellerOS.git
cd JewellerOS

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests

JewellerOS includes full acceptance test coverage verifying the financial pricing engine:

```bash
npm test
```

### Production Build

```bash
npm run build
npm run start
```

---

## ☁️ Deploy to Vercel

The repository is 100% pre-configured and ready for Vercel deployment:

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import **`JewellerOS`**.
4. Leave all settings default (Next.js preset) and click **"Deploy"**.
5. Your live application will be available within ~60 seconds with an instant SSL certificate.

---

## 👤 Credits

* **Showroom**: Sandhya Jewellers · 142 Sarafa Bazar, M.I. Road, Jaipur, RJ
* **Owner & Architecture**: Harshit Raj
* **Repository**: [https://github.com/hrajsoni/JewellerOS.git](https://github.com/hrajsoni/JewellerOS.git)

---

## 📄 License

Private & Proprietary © 2026 Sandhya Jewellers. All rights reserved.
