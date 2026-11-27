import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { mapPaymentMethodToDb } from '@/lib/prismaMappers';

export interface ServerSyncMutationInput {
  id?: string;
  idempotencyKey: string;
  businessId?: string;
  deviceId?: string;
  mutationType?: string;
  payload: any;
}

export interface ServerBatchSyncOptions {
  session?: {
    id?: string;
    businessId?: string;
    role?: string;
  } | null;
  businessId?: string;
  prismaClient?: any;
}

export interface SyncMutationResult {
  idempotencyKey: string;
  officialInvoiceNumber?: string;
  status: 'SYNCED' | 'CONFLICT' | 'FAILED';
  error?: string;
}

/**
 * Pure server-side batch sync processor.
 * Checks idempotency, validates stock availability, atomically inserts invoice, items, payments,
 * and updates stock items and stock movements.
 */
export async function processServerOutboxBatch(
  mutations: ServerSyncMutationInput[],
  options?: ServerBatchSyncOptions
): Promise<{
  syncedCount: number;
  results: SyncMutationResult[];
}> {
  const db = options?.prismaClient || prisma;
  const session = options?.session;
  const fallbackBusinessId = options?.businessId || session?.businessId || 'tenant-sandhya-jaipur';

  const results: SyncMutationResult[] = [];
  let syncedCount = 0;

  for (const mutation of mutations) {
    const idempotencyKey = mutation.idempotencyKey;
    if (!idempotencyKey) {
      results.push({
        idempotencyKey: 'UNKNOWN',
        status: 'FAILED',
        error: 'Missing idempotencyKey in mutation payload',
      });
      continue;
    }

    const targetBusinessId = mutation.businessId || fallbackBusinessId;

    // 1. Idempotency Check:
    // If mutation with idempotencyKey was already processed, return existing result immediately.
    // This prevents duplicate sales/bills on client re-transmits.
    const existingMutation = await db.offlineOutboxMutation.findUnique({
      where: { idempotencyKey },
    });

    if (existingMutation) {
      let existingPayload: any = {};
      try {
        existingPayload =
          typeof existingMutation.payload === 'string'
            ? JSON.parse(existingMutation.payload)
            : existingMutation.payload || {};
      } catch {
        existingPayload = {};
      }

      const officialInvoiceNumber =
        existingPayload.officialInvoiceNumber || existingPayload.invoiceNumber;

      results.push({
        idempotencyKey,
        officialInvoiceNumber,
        status: existingMutation.status as 'SYNCED' | 'CONFLICT' | 'FAILED',
        error: existingMutation.lastError || undefined,
      });

      if (existingMutation.status === 'SYNCED') {
        syncedCount++;
      }
      continue;
    }

    // Parse mutation payload
    let payload = mutation.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }
    payload = payload || {};

    const items: any[] = Array.isArray(payload.items) ? payload.items : [];
    const payments: any[] = Array.isArray(payload.payments) ? payload.payments : [];

    // 2. Execute atomic transaction
    try {
      const txResult = await db.$transaction(async (tx: any) => {
        // A. Validate stock item availability.
        // If piece is already sold, record mutation as CONFLICT and return conflict error.
        const matchedStockItems: any[] = [];
        const resolvedStockIds = new Map<number, string>();

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          let stockItem: any = null;

          if (item.stockItemId) {
            stockItem = await tx.stockItem.findUnique({
              where: { id: item.stockItemId },
            });
          } else if (item.barcode) {
            stockItem = await tx.stockItem.findFirst({
              where: { barcode: item.barcode, businessId: targetBusinessId },
            });
          }

          if (stockItem) {
            if (stockItem.status === 'SOLD') {
              const conflictMsg = `Stock piece '${stockItem.title || stockItem.barcode}' is already sold by another counter.`;
              // Record CONFLICT mutation in DB
              await tx.offlineOutboxMutation.create({
                data: {
                  businessId: targetBusinessId,
                  deviceId: mutation.deviceId || 'DEV-OFFLINE',
                  idempotencyKey,
                  mutationType: mutation.mutationType || 'CREATE_INVOICE',
                  payload,
                  status: 'CONFLICT',
                  lastError: conflictMsg,
                  attempts: 1,
                },
              });

              return {
                status: 'CONFLICT' as const,
                idempotencyKey,
                error: conflictMsg,
              };
            }

            matchedStockItems.push(stockItem);
            resolvedStockIds.set(i, stockItem.id);
          }
        }

        // B. Generate official server invoice number
        const invoiceCount = await tx.invoice.count({
          where: { businessId: targetBusinessId },
        });
        const currentYear = new Date().getFullYear();
        const officialInvoiceNumber = `INV-${currentYear}-${String(invoiceCount + 1).padStart(4, '0')}`;

        // C. Customer upsert / resolution
        let resolvedCustomerId: string | undefined = payload.customerId || undefined;
        const cleanPhone = String(payload.customerPhone || '').trim();
        if (!resolvedCustomerId && cleanPhone.length >= 5) {
          const upsertedCustomer = await tx.customer.upsert({
            where: {
              businessId_phone: {
                businessId: targetBusinessId,
                phone: cleanPhone,
              },
            },
            update: {
              name: payload.customerName || 'Customer',
              totalPurchased: { increment: new Prisma.Decimal(payload.grandTotal || 0) },
              ...(Number(payload.balanceDue || 0) > 0
                ? { outstandingDue: { increment: new Prisma.Decimal(payload.balanceDue) } }
                : {}),
            },
            create: {
              businessId: targetBusinessId,
              name: payload.customerName || 'Customer',
              phone: cleanPhone,
              city: payload.customerCity || 'Jaipur',
              gstin: payload.customerGstin || undefined,
              totalPurchased: new Prisma.Decimal(payload.grandTotal || 0),
              outstandingDue: new Prisma.Decimal(Math.max(0, Number(payload.balanceDue || 0))),
            },
          });
          resolvedCustomerId = upsertedCustomer.id;
        }

        // D. Insert Invoice and InvoiceItems
        const invoice = await tx.invoice.create({
          data: {
            businessId: targetBusinessId,
            branchId: payload.branchId || undefined,
            invoiceNumber: officialInvoiceNumber,
            type: payload.type || 'RETAIL_GST',
            status: 'FINALIZED',
            customerId: resolvedCustomerId,
            customerName: payload.customerName || 'Walk-in Customer',
            customerPhone: cleanPhone,
            customerCity: payload.customerCity || 'Jaipur',
            customerGstin: payload.customerGstin || undefined,
            subtotal: new Prisma.Decimal(payload.subtotal || 0),
            makingTotal: new Prisma.Decimal(payload.makingTotal || 0),
            discountTotal: new Prisma.Decimal(payload.discountTotal || 0),
            taxableAmount: new Prisma.Decimal(payload.taxableAmount || payload.subtotal || 0),
            cgstAmount: new Prisma.Decimal(payload.cgstAmount || 0),
            sgstAmount: new Prisma.Decimal(payload.sgstAmount || 0),
            roundOff: new Prisma.Decimal(payload.roundOff || 0),
            grandTotal: new Prisma.Decimal(payload.grandTotal || 0),
            oldGoldDeduction: new Prisma.Decimal(payload.oldGoldDeduction || 0),
            netPayable: new Prisma.Decimal(payload.netPayable ?? payload.grandTotal ?? 0),
            totalPaid: new Prisma.Decimal(payload.totalPaid ?? payload.grandTotal ?? 0),
            balanceDue: new Prisma.Decimal(payload.balanceDue || 0),
            createdById: payload.createdById || session?.id || undefined,
            items: {
              create: items.map((it: any, idx: number) => ({
                stockItemId: resolvedStockIds.get(idx) || undefined,
                description: it.description || it.title || it.name || 'Jewellery Ornament',
                metal: String(it.metal || 'GOLD').toUpperCase() === 'SILVER' ? 'SILVER' : 'GOLD',
                purityKey: it.purityKey || it.purity || '22K',
                grossWeight: new Prisma.Decimal(it.grossWeight || 0),
                netWeight: new Prisma.Decimal(it.netWeight || it.grossWeight || 0),
                metalRate: new Prisma.Decimal(it.metalRate || 0),
                metalValue: new Prisma.Decimal(it.metalValue || 0),
                makingCharges: new Prisma.Decimal(it.makingCharges || 0),
                stoneValue: new Prisma.Decimal(it.stoneValue || 0),
                discount: new Prisma.Decimal(it.discount || 0),
                itemSubtotal: new Prisma.Decimal(
                  it.itemSubtotal || it.totalBeforeTax || it.totalPrice || 0
                ),
              })),
            },
            payments: {
              create: payments.map((p: any) => ({
                method: mapPaymentMethodToDb(p.method || 'CASH'),
                amount: new Prisma.Decimal(p.amount || 0),
                referenceNo: p.referenceNo || p.transactionRef || undefined,
              })),
            },
          },
        });

        // E. Transition stock items to SOLD & append StockMovement audit records
        for (const stockItem of matchedStockItems) {
          await tx.stockItem.update({
            where: { id: stockItem.id },
            data: { status: 'SOLD' },
          });

          await tx.stockMovement.create({
            data: {
              stockItemId: stockItem.id,
              fromStatus: stockItem.status || 'IN_SHOWCASE',
              toStatus: 'SOLD',
              reason: `Retail Invoice ${officialInvoiceNumber} (Offline Outbox Sync)`,
              referenceType: 'RETAIL_INVOICE',
              referenceId: invoice.id,
              fromLocation: stockItem.trayLocation || 'SHOWCASE',
              toLocation: 'CUSTOMER',
            },
          });
        }

        // F. Record mutation in OfflineOutboxMutation with status SYNCED
        await tx.offlineOutboxMutation.create({
          data: {
            businessId: targetBusinessId,
            deviceId: mutation.deviceId || 'DEV-OFFLINE',
            idempotencyKey,
            mutationType: mutation.mutationType || 'CREATE_INVOICE',
            payload: {
              ...payload,
              officialInvoiceNumber,
              invoiceId: invoice.id,
            },
            status: 'SYNCED',
            syncedAt: new Date(),
            attempts: 1,
          },
        });

        return {
          status: 'SYNCED' as const,
          idempotencyKey,
          officialInvoiceNumber,
        };
      });

      if (txResult.status === 'SYNCED') {
        syncedCount++;
        results.push(txResult);
      } else {
        results.push(txResult);
      }
    } catch (txError: any) {
      results.push({
        idempotencyKey,
        status: 'FAILED',
        error: txError?.message || 'Transaction error during sync',
      });
    }
  }

  return {
    syncedCount,
    results,
  };
}
