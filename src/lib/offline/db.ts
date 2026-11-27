import Dexie, { type EntityTable, type DexieOptions } from 'dexie';

// In Node.js / testing environments where IndexedDB is not natively defined,
// safely load fake-indexeddb polyfill so Dexie operations work reliably.
if (typeof window === 'undefined' && typeof (globalThis as any).indexedDB === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('fake-indexeddb/auto');
  } catch {
    // fallback or ignore if already loaded or not available
  }
}

export interface LocalOfflineInvoice {
  id: string; // Local client UUID
  provisionalNumber: string; // e.g. PROV-BR1-0001
  businessId: string;
  branchId?: string | null;
  customerName: string;
  customerPhone: string;
  customerGstin?: string | null;
  subtotal: string;
  taxableAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  grandTotal: string;
  itemsJson: string; // Serialized line items
  paymentsJson: string; // Serialized payment tenders
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  officialInvoiceNumber?: string;
  createdAt: number;
  syncedAt?: number;
}

export interface LocalSyncOutboxItem {
  id: string; // UUID
  idempotencyKey: string;
  businessId: string;
  deviceId: string;
  mutationType: 'CREATE_INVOICE' | 'UPDATE_STOCK' | 'RECORD_PAYMENT';
  payloadJson: string;
  attempts: number;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LocalCachedStockItem {
  id: string;
  businessId: string;
  barcode: string;
  sku: string;
  title: string;
  metal: string;
  purityKey: string;
  grossWeight: string;
  netWeight: string;
  fineGoldEq: string;
  makingValue: string;
  status: string;
  trayLocation?: string | null;
  cachedAt: number;
}

// Dexie database definition for offline resilience
export class JewelleryOfflineDatabase extends Dexie {
  invoices!: EntityTable<LocalOfflineInvoice, 'id'>;
  outbox!: EntityTable<LocalSyncOutboxItem, 'id'>;
  cachedStock!: EntityTable<LocalCachedStockItem, 'id'>;

  constructor(name = 'JewelBillOfflineDb', options?: DexieOptions) {
    super(name, options);
    this.version(1).stores({
      invoices: 'id, provisionalNumber, businessId, status, createdAt',
      outbox: 'id, idempotencyKey, businessId, status, createdAt',
      cachedStock: 'id, barcode, businessId, status, cachedAt',
    });
  }
}

// Singleton database instance
export const offlineDb = new JewelleryOfflineDatabase();
