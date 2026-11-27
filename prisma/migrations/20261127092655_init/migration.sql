-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALESPERSON', 'INVENTORY_CLERK', 'KARIGAR_MANAGER');

-- CreateEnum
CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER', 'PLATINUM');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_SHOWCASE', 'IN_VAULT', 'RESERVED', 'SOLD', 'WITH_KARIGAR', 'IN_REPAIR', 'ON_MEMO', 'DAMAGED', 'RETURNED_TO_SUPPLIER');

-- CreateEnum
CREATE TYPE "MakingType" AS ENUM ('PERCENTAGE', 'PER_GRAM', 'FIXED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('RETAIL_GST', 'WHOLESALE_GST', 'CASH_MEMO', 'ESTIMATE', 'OLD_GOLD_PURCHASE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'FINALIZED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OLD_GOLD', 'CREDIT');

-- CreateEnum
CREATE TYPE "KarigarTxnType" AS ENUM ('ISSUE_METAL', 'RECEIVE_ORNAMENT', 'PAY_LABOUR');

-- CreateEnum
CREATE TYPE "GirviStatus" AS ENUM ('ACTIVE', 'RELEASED', 'AUCTIONED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "legalEntityName" VARCHAR(150),
    "gstin" VARCHAR(15),
    "bisLicense" VARCHAR(50),
    "panNumber" VARCHAR(10),
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "address" TEXT NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "currency" VARCHAR(5) NOT NULL DEFAULT 'INR',
    "logoUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "phone" VARCHAR(20),
    "address" TEXT,
    "isMainVault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "RoleType" NOT NULL DEFAULT 'SALESPERSON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "monthlySalary" DECIMAL(12,2),
    "advanceBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showroom_master_settings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "showroomName" VARCHAR(150) NOT NULL,
    "tagline" VARCHAR(150),
    "addressLine1" VARCHAR(200) NOT NULL,
    "addressLine2" VARCHAR(200),
    "city" VARCHAR(50) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "stateCode" VARCHAR(5) NOT NULL DEFAULT '08',
    "contactPhones" TEXT[],
    "email" VARCHAR(100),
    "gstin" VARCHAR(15) NOT NULL,
    "bisHallmarkLicense" VARCHAR(50),
    "panNumber" VARCHAR(10),
    "cinNumber" VARCHAR(30),
    "invoiceFormat" VARCHAR(30) NOT NULL DEFAULT 'A4_DETAILED',
    "defaultTaxRate" DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    "thermalPrinterWidth" INTEGER NOT NULL DEFAULT 50,
    "barcodeTagFormat" VARCHAR(40) NOT NULL DEFAULT 'TAG_50x25_BUTTERFLY',
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "showroom_master_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metal_rates" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purityKey" VARCHAR(10) NOT NULL,
    "purityPercent" DECIMAL(6,4) NOT NULL,
    "sellingRate" DECIMAL(12,2) NOT NULL,
    "purchaseRate" DECIMAL(12,2) NOT NULL,
    "effectiveAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    "source" VARCHAR(50) DEFAULT 'MANUAL',
    "notes" TEXT,

    CONSTRAINT "metal_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "metal" "MetalType" NOT NULL,
    "defaultPurity" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "hsnCode" VARCHAR(10) NOT NULL DEFAULT '7113',
    "standardMaking" DECIMAL(8,2),
    "makingType" "MakingType" NOT NULL DEFAULT 'PERCENTAGE',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "productId" TEXT NOT NULL,
    "barcode" VARCHAR(50) NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purityKey" VARCHAR(10) NOT NULL,
    "grossWeight" DECIMAL(10,3) NOT NULL,
    "stoneWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "netWeight" DECIMAL(10,3) NOT NULL,
    "fineGoldEq" DECIMAL(10,3) NOT NULL,
    "makingType" "MakingType" NOT NULL DEFAULT 'PERCENTAGE',
    "makingValue" DECIMAL(8,2) NOT NULL,
    "acquisitionCost" DECIMAL(12,2) NOT NULL,
    "trayLocation" VARCHAR(50),
    "status" "StockStatus" NOT NULL DEFAULT 'IN_SHOWCASE',
    "supplierId" TEXT,
    "huid" VARCHAR(20),
    "dateAcquired" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "fromStatus" "StockStatus" NOT NULL,
    "toStatus" "StockStatus" NOT NULL,
    "reason" VARCHAR(150) NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(100),
    "fromLocation" VARCHAR(100),
    "toLocation" VARCHAR(100),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedById" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'RETAIL_GST',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'FINALIZED',
    "invoiceDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "customerGstin" VARCHAR(15),
    "customerCity" VARCHAR(50),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "makingTotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(12,2) NOT NULL,
    "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "roundOff" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "oldGoldDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netPayable" DECIMAL(12,2) NOT NULL,
    "totalPaid" DECIMAL(12,2) NOT NULL,
    "balanceDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "stockItemId" TEXT,
    "description" VARCHAR(150) NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purityKey" VARCHAR(10) NOT NULL,
    "grossWeight" DECIMAL(10,3) NOT NULL,
    "netWeight" DECIMAL(10,3) NOT NULL,
    "metalRate" DECIMAL(12,2) NOT NULL,
    "metalValue" DECIMAL(12,2) NOT NULL,
    "makingCharges" DECIMAL(10,2) NOT NULL,
    "stoneValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "itemSubtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceNo" VARCHAR(100),
    "paymentDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100),
    "city" VARCHAR(50) NOT NULL DEFAULT 'Jaipur',
    "address" TEXT,
    "gstin" VARCHAR(15),
    "panNumber" VARCHAR(10),
    "totalPurchased" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contactPerson" VARCHAR(100),
    "phone" VARCHAR(20) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "gstin" VARCHAR(15),
    "metalSupplied" "MetalType" NOT NULL DEFAULT 'GOLD',
    "outstandingDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fineGoldBalance" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "fineSilverBalance" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" VARCHAR(50) NOT NULL,
    "invoiceDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supplierName" VARCHAR(100) NOT NULL,
    "itemsSubtotal" DECIMAL(12,2) NOT NULL,
    "totalMaking" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalGst" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentMethod" VARCHAR(30) NOT NULL DEFAULT 'Cash',
    "status" VARCHAR(20) NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseInvoiceId" TEXT NOT NULL,
    "description" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purity" VARCHAR(10) NOT NULL,
    "grossWeight" DECIMAL(10,3) NOT NULL,
    "stoneWeight" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "netWeight" DECIMAL(10,3) NOT NULL,
    "fineWeight" DECIMAL(10,3) NOT NULL,
    "metalRate" DECIMAL(12,2) NOT NULL,
    "makingRate" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "trayLocation" VARCHAR(50) NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" VARCHAR(30) NOT NULL,
    "referenceNo" VARCHAR(100),
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_partners" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "businessName" VARCHAR(100) NOT NULL,
    "contactPerson" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "address" TEXT,
    "gstin" VARCHAR(15),
    "totalPurchased" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_memos" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "b2bPartnerId" TEXT,
    "memoNumber" VARCHAR(50) NOT NULL,
    "partnerName" VARCHAR(100) NOT NULL,
    "partnerPhone" VARCHAR(20) NOT NULL,
    "partnerCity" VARCHAR(50),
    "partnerGstin" VARCHAR(15),
    "issueDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntilDate" TIMESTAMPTZ NOT NULL,
    "totalPieces" INTEGER NOT NULL,
    "totalGrossWeight" DECIMAL(10,3) NOT NULL,
    "totalNetWeight" DECIMAL(10,3) NOT NULL,
    "totalFineWeight" DECIMAL(10,3) NOT NULL,
    "totalEstimatedValue" DECIMAL(14,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'active_issued',
    "convertedInvoiceNumber" VARCHAR(50),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "consignment_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_memo_items" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "stockItemId" TEXT,
    "sku" VARCHAR(50),
    "barcode" VARCHAR(50),
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purity" VARCHAR(10) NOT NULL,
    "grossWeight" DECIMAL(10,3) NOT NULL,
    "netWeight" DECIMAL(10,3) NOT NULL,
    "fineWeight" DECIMAL(10,3) NOT NULL,
    "wholesaleRate" DECIMAL(12,2) NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'on_memo',

    CONSTRAINT "consignment_memo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karigars" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "workshopCity" VARCHAR(50) NOT NULL,
    "specialty" VARCHAR(100) NOT NULL,
    "pureGoldBalanceGrams" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "pureSilverBalance" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "labourBalanceDue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "karigars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karigar_transactions" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "type" "KarigarTxnType" NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metal" "MetalType" NOT NULL,
    "grossWeight" DECIMAL(10,3),
    "netWeight" DECIMAL(10,3),
    "fineWeightDelta" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "ornamentName" VARCHAR(100),
    "labourAmount" DECIMAL(10,2),
    "paymentAmount" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "karigar_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_cards" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "jobCardNumber" VARCHAR(50) NOT NULL,
    "karigarName" VARCHAR(100) NOT NULL,
    "customerName" VARCHAR(100),
    "customerPhone" VARCHAR(20),
    "category" VARCHAR(50) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "metal" "MetalType" NOT NULL,
    "targetGrossWeight" DECIMAL(10,3) NOT NULL,
    "targetNetWeight" DECIMAL(10,3) NOT NULL,
    "purity" VARCHAR(10) NOT NULL,
    "issuedFineWeightGrams" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "expectedDeliveryDate" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'created',
    "labourRate" DECIMAL(10,2) NOT NULL,
    "labourType" VARCHAR(20) NOT NULL DEFAULT 'per_gram',
    "allowedWastagePercent" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "huid" VARCHAR(20),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "girvi_loans" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "loanNumber" VARCHAR(50) NOT NULL,
    "packetNumber" VARCHAR(50) NOT NULL,
    "safeLocation" VARCHAR(50) NOT NULL,
    "customerId" TEXT,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "customerCity" VARCHAR(50) NOT NULL DEFAULT 'Jaipur',
    "customerAddress" TEXT,
    "startDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ NOT NULL,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "monthlyInterestRate" DECIMAL(5,2) NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 6,
    "status" "GirviStatus" NOT NULL DEFAULT 'ACTIVE',
    "settledDate" TIMESTAMPTZ,
    "principalRepaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalInterestPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "girvi_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pledged_ornaments" (
    "id" TEXT NOT NULL,
    "girviLoanId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "purity" VARCHAR(10) NOT NULL,
    "grossWeight" DECIMAL(10,3) NOT NULL,
    "netWeight" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "pledged_ornaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_jobs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "repairNumber" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "ornamentName" VARCHAR(150) NOT NULL,
    "intakeGrossWeight" DECIMAL(10,3) NOT NULL,
    "problemDescription" TEXT NOT NULL,
    "estimatedCost" DECIMAL(10,2) NOT NULL,
    "advancePaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(30) NOT NULL DEFAULT 'received',
    "intakeDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryPromiseDate" TIMESTAMPTZ NOT NULL,
    "deliveredAt" TIMESTAMPTZ,

    CONSTRAINT "repair_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_booking_orders" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderNumber" VARCHAR(50) NOT NULL,
    "customerName" VARCHAR(100) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "ornamentType" VARCHAR(100) NOT NULL,
    "targetGrossWeight" DECIMAL(10,3) NOT NULL,
    "purity" VARCHAR(10) NOT NULL,
    "lockedGoldRatePer10g" DECIMAL(12,2),
    "advanceAmountPaid" DECIMAL(12,2) NOT NULL,
    "estimatedTotalAmount" DECIMAL(12,2) NOT NULL,
    "deliveryPromiseDate" TIMESTAMPTZ NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'placed',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_booking_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "monthlySalary" DECIMAL(10,2) NOT NULL,
    "advanceBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "joiningDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_payments" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "paymentMode" VARCHAR(30) NOT NULL DEFAULT 'Cash',
    "monthYear" VARCHAR(20),
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "staff_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "AccountType" NOT NULL,
    "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "voucherNumber" VARCHAR(50) NOT NULL,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debitAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_expenses" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMode" VARCHAR(30) NOT NULL,
    "paidTo" VARCHAR(100) NOT NULL,
    "voucherNumber" VARCHAR(50),
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "recordedBy" VARCHAR(100) NOT NULL,

    CONSTRAINT "shop_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_cash_closings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "openingCash" DECIMAL(12,2) NOT NULL,
    "cashSales" DECIMAL(12,2) NOT NULL,
    "cashAdvances" DECIMAL(12,2) NOT NULL,
    "supplierCashPaid" DECIMAL(12,2) NOT NULL,
    "karigarCashPaid" DECIMAL(12,2) NOT NULL,
    "cashExpenses" DECIMAL(12,2) NOT NULL,
    "expectedCash" DECIMAL(12,2) NOT NULL,
    "physicalCash" DECIMAL(12,2) NOT NULL,
    "discrepancy" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "denominations" JSONB NOT NULL,
    "closedBy" VARCHAR(100) NOT NULL,
    "closedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "daily_cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_businessId_code_key" ON "branches"("businessId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "showroom_master_settings_businessId_key" ON "showroom_master_settings"("businessId");

-- CreateIndex
CREATE INDEX "metal_rates_businessId_metal_effectiveAt_idx" ON "metal_rates"("businessId", "metal", "effectiveAt" DESC);

-- CreateIndex
CREATE INDEX "products_businessId_category_idx" ON "products"("businessId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_barcode_key" ON "stock_items"("barcode");

-- CreateIndex
CREATE INDEX "stock_items_businessId_status_idx" ON "stock_items"("businessId", "status");

-- CreateIndex
CREATE INDEX "stock_items_businessId_barcode_idx" ON "stock_items"("businessId", "barcode");

-- CreateIndex
CREATE INDEX "stock_movements_stockItemId_timestamp_idx" ON "stock_movements"("stockItemId", "timestamp");

-- CreateIndex
CREATE INDEX "invoices_businessId_invoiceDate_idx" ON "invoices"("businessId", "invoiceDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_businessId_invoiceNumber_key" ON "invoices"("businessId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customers_businessId_phone_key" ON "customers"("businessId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoices_businessId_invoiceNumber_key" ON "purchase_invoices"("businessId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "consignment_memos_businessId_memoNumber_key" ON "consignment_memos"("businessId", "memoNumber");

-- CreateIndex
CREATE INDEX "karigar_transactions_karigarId_date_idx" ON "karigar_transactions"("karigarId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "job_cards_businessId_jobCardNumber_key" ON "job_cards"("businessId", "jobCardNumber");

-- CreateIndex
CREATE INDEX "girvi_loans_businessId_status_idx" ON "girvi_loans"("businessId", "status");

-- CreateIndex
CREATE INDEX "girvi_loans_businessId_packetNumber_idx" ON "girvi_loans"("businessId", "packetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "girvi_loans_businessId_loanNumber_key" ON "girvi_loans"("businessId", "loanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "repair_jobs_businessId_repairNumber_key" ON "repair_jobs"("businessId", "repairNumber");

-- CreateIndex
CREATE UNIQUE INDEX "custom_booking_orders_businessId_orderNumber_key" ON "custom_booking_orders"("businessId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_businessId_code_key" ON "accounts"("businessId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "daily_cash_closings_businessId_date_key" ON "daily_cash_closings"("businessId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp" DESC);

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showroom_master_settings" ADD CONSTRAINT "showroom_master_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metal_rates" ADD CONSTRAINT "metal_rates_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partners" ADD CONSTRAINT "b2b_partners_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_memos" ADD CONSTRAINT "consignment_memos_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_memos" ADD CONSTRAINT "consignment_memos_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_memo_items" ADD CONSTRAINT "consignment_memo_items_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "consignment_memos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karigars" ADD CONSTRAINT "karigars_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karigar_transactions" ADD CONSTRAINT "karigar_transactions_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "karigars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_cards" ADD CONSTRAINT "job_cards_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "karigars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "girvi_loans" ADD CONSTRAINT "girvi_loans_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "girvi_loans" ADD CONSTRAINT "girvi_loans_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pledged_ornaments" ADD CONSTRAINT "pledged_ornaments_girviLoanId_fkey" FOREIGN KEY ("girviLoanId") REFERENCES "girvi_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_booking_orders" ADD CONSTRAINT "custom_booking_orders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_booking_orders" ADD CONSTRAINT "custom_booking_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_expenses" ADD CONSTRAINT "shop_expenses_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_cash_closings" ADD CONSTRAINT "daily_cash_closings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
