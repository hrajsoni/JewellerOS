import { offlineDb, JewelleryOfflineDatabase, LocalOfflineInvoice, LocalSyncOutboxItem } from './db';

export interface QueueInvoiceData {
  id?: string;
  provisionalNumber?: string;
  businessId?: string;
  branchId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string | null;
  customerCity?: string;
  subtotal?: string | number;
  makingTotal?: string | number;
  discountTotal?: string | number;
  taxableAmount?: string | number;
  cgstAmount?: string | number;
  sgstAmount?: string | number;
  roundOff?: string | number;
  grandTotal?: string | number;
  oldGoldDeduction?: string | number;
  netPayable?: string | number;
  totalPaid?: string | number;
  balanceDue?: string | number;
  createdById?: string;
  items?: any[] | string;
  [key: string]: any;
}

export interface QueueMutationOptions {
  deviceId?: string;
  customIdempotencyKey?: string;
  db?: JewelleryOfflineDatabase;
}

export interface ProcessOutboxOptions {
  endpoint?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
  force?: boolean;
  batchSize?: number;
  db?: JewelleryOfflineDatabase;
}

export interface SyncResultItem {
  idempotencyKey: string;
  officialInvoiceNumber?: string;
  status: 'SYNCED' | 'CONFLICT' | 'FAILED' | 'QUEUED';
  error?: string;
}

export interface ProcessOutboxResult {
  processedCount: number;
  syncedCount: number;
  results: SyncResultItem[];
  error?: string;
}

// Device ID tracking
let currentDeviceId = 'DEV-TERMINAL-01';

export function getDeviceId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('jewelbill_device_id');
    if (saved) return saved;
    const generated = `DEV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try {
      localStorage.setItem('jewelbill_device_id', generated);
    } catch {}
    return generated;
  }
  return currentDeviceId;
}

export function setDeviceId(id: string): void {
  currentDeviceId = id;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('jewelbill_device_id', id);
    } catch {}
  }
}

/**
 * Calculates exponential backoff in milliseconds based on attempt count.
 * Attempt 0 -> 0ms
 * Attempt 1 -> 1,000ms
 * Attempt 2 -> 2,000ms
 * Attempt 3 -> 4,000ms
 * Attempt 4 -> 8,000ms
 * Capped at maxMs (default 60,000ms).
 */
export function calculateExponentialBackoff(attempts: number, baseMs = 1000, maxMs = 60000): number {
  if (attempts <= 0) return 0;
  return Math.min(maxMs, baseMs * Math.pow(2, attempts - 1));
}

/**
 * Queues an invoice and its tenders into the local offline database within a single Dexie transaction.
 * Generates a client UUID and unique idempotency key.
 * Stores the invoice with status 'PENDING_SYNC' and the mutation with status 'QUEUED'.
 */
export async function queueInvoiceMutation(
  invoiceData: QueueInvoiceData,
  paymentData?: any[] | string,
  options?: QueueMutationOptions
): Promise<{
  invoice: LocalOfflineInvoice;
  outboxItem: LocalSyncOutboxItem;
  idempotencyKey: string;
  clientInvoiceId: string;
}> {
  const db = options?.db || offlineDb;
  const clientInvoiceId = invoiceData.id || crypto.randomUUID();
  const idempotencyKey = options?.customIdempotencyKey || crypto.randomUUID();
  const businessId = invoiceData.businessId || 'tenant-sandhya-jaipur';
  const deviceId = options?.deviceId || getDeviceId();
  const now = Date.now();

  const provisionalNumber =
    invoiceData.provisionalNumber ||
    `PROV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const itemsArray = Array.isArray(invoiceData.items)
    ? invoiceData.items
    : typeof invoiceData.items === 'string'
    ? JSON.parse(invoiceData.items)
    : [];

  const paymentsArray = Array.isArray(paymentData)
    ? paymentData
    : typeof paymentData === 'string'
    ? JSON.parse(paymentData)
    : [];

  const localInvoice: LocalOfflineInvoice = {
    id: clientInvoiceId,
    provisionalNumber,
    businessId,
    branchId: invoiceData.branchId ?? null,
    customerName: invoiceData.customerName || 'Walk-in Customer',
    customerPhone: invoiceData.customerPhone || '',
    customerGstin: invoiceData.customerGstin ?? null,
    subtotal: String(invoiceData.subtotal ?? '0'),
    taxableAmount: String(invoiceData.taxableAmount ?? invoiceData.subtotal ?? '0'),
    cgstAmount: String(invoiceData.cgstAmount ?? '0'),
    sgstAmount: String(invoiceData.sgstAmount ?? '0'),
    grandTotal: String(invoiceData.grandTotal ?? '0'),
    itemsJson: JSON.stringify(itemsArray),
    paymentsJson: JSON.stringify(paymentsArray),
    status: 'PENDING_SYNC',
    createdAt: now,
  };

  const payload = {
    clientInvoiceId,
    idempotencyKey,
    businessId,
    branchId: localInvoice.branchId,
    deviceId,
    provisionalNumber,
    customerName: localInvoice.customerName,
    customerPhone: localInvoice.customerPhone,
    customerGstin: localInvoice.customerGstin,
    customerCity: invoiceData.customerCity || 'Jaipur',
    subtotal: localInvoice.subtotal,
    makingTotal: String(invoiceData.makingTotal ?? '0'),
    discountTotal: String(invoiceData.discountTotal ?? '0'),
    taxableAmount: localInvoice.taxableAmount,
    cgstAmount: localInvoice.cgstAmount,
    sgstAmount: localInvoice.sgstAmount,
    roundOff: String(invoiceData.roundOff ?? '0'),
    grandTotal: localInvoice.grandTotal,
    oldGoldDeduction: String(invoiceData.oldGoldDeduction ?? '0'),
    netPayable: String(invoiceData.netPayable ?? localInvoice.grandTotal),
    totalPaid: String(invoiceData.totalPaid ?? localInvoice.grandTotal),
    balanceDue: String(invoiceData.balanceDue ?? '0'),
    createdById: invoiceData.createdById,
    items: itemsArray,
    payments: paymentsArray,
    createdAt: now,
  };

  const outboxItem: LocalSyncOutboxItem = {
    id: crypto.randomUUID(),
    idempotencyKey,
    businessId,
    deviceId,
    mutationType: 'CREATE_INVOICE',
    payloadJson: JSON.stringify(payload),
    attempts: 0,
    status: 'QUEUED',
    createdAt: now,
    updatedAt: now,
  };

  // Atomic Dexie transaction saving invoice and outbox entry
  await db.transaction('rw', [db.invoices, db.outbox], async () => {
    await db.invoices.put(localInvoice);
    await db.outbox.put(outboxItem);
  });

  return {
    invoice: localInvoice,
    outboxItem,
    idempotencyKey,
    clientInvoiceId,
  };
}

/**
 * Iterates through QUEUED mutations, posts to /api/sync/outbox, updates local status to SYNCING,
 * and on successful response updates local invoice status to SYNCED with official server invoice number.
 * Gracefully handles network failures by keeping mutations in QUEUED with exponential backoff.
 */
export async function processOutbox(options?: ProcessOutboxOptions): Promise<ProcessOutboxResult> {
  const db = options?.db || offlineDb;
  const fetchFn = options?.fetchFn || globalThis.fetch;
  const endpoint = options?.endpoint || '/api/sync/outbox';
  const now = Date.now();

  // 1. Query QUEUED mutations from Dexie
  const queuedItems = await db.outbox.where('status').equals('QUEUED').sortBy('createdAt');

  if (!queuedItems || queuedItems.length === 0) {
    return {
      processedCount: 0,
      syncedCount: 0,
      results: [],
    };
  }

  // 2. Filter for mutations eligible according to exponential backoff
  const eligible = queuedItems.filter((item) => {
    if (options?.force || item.attempts === 0) return true;
    const backoffMs = calculateExponentialBackoff(item.attempts);
    return now - item.updatedAt >= backoffMs;
  });

  if (eligible.length === 0) {
    return {
      processedCount: 0,
      syncedCount: 0,
      results: [],
    };
  }

  const batch = options?.batchSize ? eligible.slice(0, options.batchSize) : eligible;

  // 3. Transition local outbox status to SYNCING and increment attempts
  for (const item of batch) {
    await db.outbox.update(item.id, {
      status: 'SYNCING',
      attempts: item.attempts + 1,
      updatedAt: Date.now(),
    });
  }

  // 4. Build mutation batch payload
  const mutationsPayload = batch.map((item) => {
    let parsedPayload: any = {};
    try {
      parsedPayload = JSON.parse(item.payloadJson);
    } catch {
      parsedPayload = {};
    }
    return {
      id: item.id,
      idempotencyKey: item.idempotencyKey,
      businessId: item.businessId,
      deviceId: item.deviceId,
      mutationType: item.mutationType,
      payload: parsedPayload,
    };
  });

  // 5. Post to server endpoint
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    const response = await fetchFn(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mutations: mutationsPayload }),
    });

    if (!response.ok) {
      throw new Error(`Sync server responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const serverResults: SyncResultItem[] = data.results || [];
    let syncedCount = 0;

    // 6. Update local Dexie records based on server results
    for (const r of serverResults) {
      const outboxItem = batch.find((it) => it.idempotencyKey === r.idempotencyKey);
      if (!outboxItem) continue;

      let parsedPayload: any = {};
      try {
        parsedPayload = JSON.parse(outboxItem.payloadJson);
      } catch {}
      const clientInvoiceId = parsedPayload.clientInvoiceId;

      if (r.status === 'SYNCED') {
        syncedCount++;
        await db.transaction('rw', [db.invoices, db.outbox], async () => {
          await db.outbox.update(outboxItem.id, {
            status: 'SYNCED',
            lastError: undefined,
            updatedAt: Date.now(),
          });
          if (clientInvoiceId) {
            await db.invoices.update(clientInvoiceId, {
              status: 'SYNCED',
              officialInvoiceNumber: r.officialInvoiceNumber,
              syncedAt: Date.now(),
            });
          }
        });
      } else if (r.status === 'CONFLICT') {
        await db.transaction('rw', [db.invoices, db.outbox], async () => {
          await db.outbox.update(outboxItem.id, {
            status: 'CONFLICT',
            lastError: r.error || 'Stock piece concurrency conflict',
            updatedAt: Date.now(),
          });
          if (clientInvoiceId) {
            await db.invoices.update(clientInvoiceId, {
              status: 'CONFLICT',
            });
          }
        });
      } else {
        await db.transaction('rw', [db.invoices, db.outbox], async () => {
          await db.outbox.update(outboxItem.id, {
            status: 'FAILED',
            lastError: r.error || 'Server processing failed',
            updatedAt: Date.now(),
          });
          if (clientInvoiceId) {
            await db.invoices.update(clientInvoiceId, {
              status: 'FAILED',
            });
          }
        });
      }
    }

    return {
      processedCount: batch.length,
      syncedCount,
      results: serverResults,
    };
  } catch (networkError: any) {
    // 7. Network or connection failure:
    // Gracefully leave items in QUEUED for next retry with exponential backoff.
    const errorMessage = networkError?.message || 'Network failure connecting to sync server';
    for (const item of batch) {
      await db.outbox.update(item.id, {
        status: 'QUEUED',
        lastError: errorMessage,
        updatedAt: Date.now(),
      });
    }

    return {
      processedCount: batch.length,
      syncedCount: 0,
      error: errorMessage,
      results: batch.map((item) => ({
        idempotencyKey: item.idempotencyKey,
        status: 'QUEUED',
        error: errorMessage,
      })),
    };
  }
}

/**
 * Retrieves all items currently in outbox.
 */
export async function getOutboxItems(
  statusFilter?: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT',
  db = offlineDb
): Promise<LocalSyncOutboxItem[]> {
  if (statusFilter) {
    return db.outbox.where('status').equals(statusFilter).toArray();
  }
  return db.outbox.toArray();
}

/**
 * Retrieves all offline invoices with optional status filter.
 */
export async function getOfflineInvoices(
  statusFilter?: 'PENDING_SYNC' | 'SYNCED' | 'FAILED' | 'CONFLICT',
  db = offlineDb
): Promise<LocalOfflineInvoice[]> {
  if (statusFilter) {
    return db.invoices.where('status').equals(statusFilter).toArray();
  }
  return db.invoices.toArray();
}

/**
 * Clears synced outbox items older than a given age (default: 7 days).
 */
export async function clearSyncedMutations(olderThanMs = 7 * 24 * 60 * 60 * 1000, db = offlineDb): Promise<number> {
  const threshold = Date.now() - olderThanMs;
  const oldSynced = await db.outbox
    .where('status')
    .equals('SYNCED')
    .filter((item) => item.updatedAt < threshold)
    .toArray();

  const ids = oldSynced.map((i) => i.id);
  await db.outbox.bulkDelete(ids);
  return ids.length;
}
