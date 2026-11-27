import 'fake-indexeddb/auto';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  JewelleryOfflineDatabase,
  LocalOfflineInvoice,
  LocalSyncOutboxItem,
} from '../src/lib/offline/db';
import {
  queueInvoiceMutation,
  processOutbox,
  calculateExponentialBackoff,
  getOutboxItems,
  getOfflineInvoices,
} from '../src/lib/offline/syncManager';
import { processServerOutboxBatch } from '../src/lib/offline/serverSync';
import { POST as serverOutboxRoutePost } from '../src/app/api/sync/outbox/route';

/**
 * Creates an in-memory Mock Prisma client for testing server-side batch sync
 * without external database connectivity requirements.
 */
function createMockPrisma() {
  const stockItems = new Map<string, any>();
  const invoices = new Map<string, any>();
  const stockMovements: any[] = [];
  const offlineMutations = new Map<string, any>();
  const customers = new Map<string, any>();

  const tx = {
    stockItem: {
      findUnique: async ({ where }: any) => {
        if (where.id) return stockItems.get(where.id) || null;
        if (where.barcode) {
          return Array.from(stockItems.values()).find((s) => s.barcode === where.barcode) || null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        return (
          Array.from(stockItems.values()).find((s) => {
            if (where.barcode && s.barcode !== where.barcode) return false;
            if (where.businessId && s.businessId !== where.businessId) return false;
            return true;
          }) || null
        );
      },
      update: async ({ where, data }: any) => {
        const item = stockItems.get(where.id);
        if (item) Object.assign(item, data);
        return item;
      },
    },
    invoice: {
      count: async ({ where }: any) => {
        let count = 0;
        for (const inv of invoices.values()) {
          if (!where?.businessId || inv.businessId === where.businessId) count++;
        }
        return count;
      },
      create: async ({ data }: any) => {
        const id = `inv-${invoices.size + 1}`;
        const record = { id, ...data };
        invoices.set(id, record);
        return record;
      },
    },
    customer: {
      upsert: async ({ create }: any) => {
        const id = `cust-${customers.size + 1}`;
        const record = { id, ...create };
        customers.set(id, record);
        return record;
      },
    },
    stockMovement: {
      create: async ({ data }: any) => {
        stockMovements.push(data);
        return data;
      },
    },
    offlineOutboxMutation: {
      findUnique: async ({ where }: any) => {
        return offlineMutations.get(where.idempotencyKey) || null;
      },
      create: async ({ data }: any) => {
        const record = { id: `mut-${offlineMutations.size + 1}`, ...data };
        offlineMutations.set(data.idempotencyKey, record);
        return record;
      },
    },
  };

  const client = {
    ...tx,
    $transaction: async (cb: (txClient: any) => Promise<any>) => cb(tx),
    _state: {
      stockItems,
      invoices,
      stockMovements,
      offlineMutations,
      customers,
    },
  };

  return client;
}

describe('Offline Sync & Outbox Queue Module Tests', () => {
  let testDb: JewelleryOfflineDatabase;

  beforeEach(async () => {
    // Generate a fresh isolated Dexie database for each test
    const uniqueDbName = `TestDb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    testDb = new JewelleryOfflineDatabase(uniqueDbName);
    await testDb.open();
  });

  describe('1. Idempotency Key Generation & Duplicate Prevention', () => {
    it('generates unique UUID idempotency keys on distinct mutation calls', async () => {
      const invoiceData = {
        businessId: 'tenant-sandhya-jaipur',
        customerName: 'Aarav Sharma',
        customerPhone: '+91 98290 11111',
        grandTotal: 125000,
        items: [
          {
            description: '22K Gold Kada',
            metal: 'GOLD',
            purityKey: '22K',
            grossWeight: 15.5,
            netWeight: 15.5,
            metalRate: 75000,
            metalValue: 116250,
            makingCharges: 8750,
            itemSubtotal: 125000,
          },
        ],
      };

      const result1 = await queueInvoiceMutation(invoiceData, [{ method: 'CASH', amount: 125000 }], {
        db: testDb,
      });
      const result2 = await queueInvoiceMutation(invoiceData, [{ method: 'CASH', amount: 125000 }], {
        db: testDb,
      });

      assert.ok(result1.idempotencyKey, 'Mutation 1 must have an idempotency key');
      assert.ok(result2.idempotencyKey, 'Mutation 2 must have an idempotency key');
      assert.notStrictEqual(
        result1.idempotencyKey,
        result2.idempotencyKey,
        'Each mutation must generate a distinct UUID idempotency key'
      );
      assert.strictEqual(
        result1.idempotencyKey.length,
        36,
        'Idempotency key must be a valid standard 36-character UUID string'
      );
    });

    it('server idempotency check prevents duplicate invoice generation on re-transmits', async () => {
      const mockPrisma = createMockPrisma();
      const fixedKey = 'uuid-idem-repeat-test-001';
      const tenantId = 'tenant-sandhya-jaipur';

      // Insert an available stock ornament in showcase
      mockPrisma._state.stockItems.set('stock-bangle-01', {
        id: 'stock-bangle-01',
        businessId: tenantId,
        barcode: 'BC-BANG-01',
        title: '22K Designer Gold Bangle',
        status: 'IN_SHOWCASE',
        trayLocation: 'TRAY-A1',
      });

      const mutation = {
        idempotencyKey: fixedKey,
        businessId: tenantId,
        deviceId: 'DEV-POS-01',
        mutationType: 'CREATE_INVOICE',
        payload: {
          customerName: 'Pooja Agarwal',
          customerPhone: '+91 94140 22222',
          grandTotal: 95000,
          subtotal: 95000,
          items: [
            {
              stockItemId: 'stock-bangle-01',
              description: '22K Designer Gold Bangle',
              metal: 'GOLD',
              purityKey: '22K',
              grossWeight: 12.0,
              itemSubtotal: 95000,
            },
          ],
          payments: [{ method: 'UPI', amount: 95000 }],
        },
      };

      // 1. First sync submission
      const firstSync = await processServerOutboxBatch([mutation], {
        prismaClient: mockPrisma,
        businessId: tenantId,
      });

      assert.strictEqual(firstSync.syncedCount, 1);
      assert.strictEqual(firstSync.results.length, 1);
      assert.strictEqual(firstSync.results[0].status, 'SYNCED');
      const firstInvoiceNum = firstSync.results[0].officialInvoiceNumber;
      assert.ok(firstInvoiceNum, 'Official invoice number must be returned');

      // Verify DB state after first sync: 1 invoice created, stock item marked SOLD
      assert.strictEqual(mockPrisma._state.invoices.size, 1);
      assert.strictEqual(mockPrisma._state.stockItems.get('stock-bangle-01').status, 'SOLD');
      assert.strictEqual(mockPrisma._state.stockMovements.length, 1);

      // 2. Client re-transmits the exact same mutation with the same idempotency key
      const secondSync = await processServerOutboxBatch([mutation], {
        prismaClient: mockPrisma,
        businessId: tenantId,
      });

      assert.strictEqual(secondSync.syncedCount, 1);
      assert.strictEqual(secondSync.results.length, 1);
      assert.strictEqual(secondSync.results[0].status, 'SYNCED');
      assert.strictEqual(
        secondSync.results[0].officialInvoiceNumber,
        firstInvoiceNum,
        'Re-transmitted mutation must return the exact existing official invoice number'
      );

      // INVARIANT: Invoices count MUST still be 1 (No duplicate billing allowed!)
      assert.strictEqual(
        mockPrisma._state.invoices.size,
        1,
        'Duplicate mutation re-transmission must NOT create a duplicate Invoice record'
      );
      assert.strictEqual(
        mockPrisma._state.stockMovements.length,
        1,
        'Duplicate mutation re-transmission must NOT create duplicate stock movement records'
      );
    });
  });

  describe('2. Mutation Queueing, Payload Validation & Dexie Storage', () => {
    it('queues invoice and outbox records atomically in Dexie with status PENDING_SYNC and QUEUED', async () => {
      const lineItems = [
        {
          stockItemId: 'stock-item-chain',
          barcode: 'BC-CHAIN-18K',
          description: '18K Italian Chain',
          metal: 'GOLD',
          purityKey: '18K',
          grossWeight: 8.5,
          netWeight: 8.5,
          metalRate: 62000,
          metalValue: 52700,
          makingCharges: 7300,
          itemSubtotal: 60000,
        },
      ];
      const tenders = [
        { method: 'CASH', amount: 20000 },
        { method: 'UPI', amount: 40000 },
      ];

      const queueResult = await queueInvoiceMutation(
        {
          businessId: 'tenant-sandhya-jaipur',
          customerName: 'Vikram Choudhary',
          customerPhone: '+91 98280 33333',
          subtotal: 60000,
          grandTotal: 60000,
          items: lineItems,
        },
        tenders,
        { db: testDb }
      );

      // Check return structure
      assert.ok(queueResult.clientInvoiceId);
      assert.ok(queueResult.idempotencyKey);
      assert.strictEqual(queueResult.invoice.status, 'PENDING_SYNC');
      assert.strictEqual(queueResult.outboxItem.status, 'QUEUED');
      assert.strictEqual(queueResult.outboxItem.attempts, 0);

      // Verify persisted state in Dexie
      const savedInvoices = await getOfflineInvoices(undefined, testDb);
      const savedOutbox = await getOutboxItems(undefined, testDb);

      assert.strictEqual(savedInvoices.length, 1);
      assert.strictEqual(savedOutbox.length, 1);

      const localInv = savedInvoices[0];
      const outboxIt = savedOutbox[0];

      assert.strictEqual(localInv.id, queueResult.clientInvoiceId);
      assert.strictEqual(localInv.status, 'PENDING_SYNC');
      assert.strictEqual(localInv.customerName, 'Vikram Choudhary');
      assert.strictEqual(localInv.grandTotal, '60000');

      // Verify payload serialization integrity
      const parsedPayload = JSON.parse(outboxIt.payloadJson);
      assert.strictEqual(parsedPayload.clientInvoiceId, queueResult.clientInvoiceId);
      assert.strictEqual(parsedPayload.idempotencyKey, queueResult.idempotencyKey);
      assert.strictEqual(parsedPayload.items.length, 1);
      assert.strictEqual(parsedPayload.items[0].description, '18K Italian Chain');
      assert.strictEqual(parsedPayload.payments.length, 2);
      assert.strictEqual(parsedPayload.payments[0].method, 'CASH');
      assert.strictEqual(parsedPayload.payments[1].method, 'UPI');
    });

    it('handles network failure gracefully: keeps mutations in QUEUED and computes exponential backoff', async () => {
      // 1. Queue an invoice
      const { outboxItem } = await queueInvoiceMutation(
        {
          customerName: 'Network Failure Test',
          grandTotal: 50000,
          items: [{ description: 'Gold Ring', itemSubtotal: 50000 }],
        },
        [{ method: 'CASH', amount: 50000 }],
        { db: testDb }
      );

      // 2. Mock a failing fetch function simulating connection drop / offline terminal
      const failingFetch = (async () => {
        throw new TypeError('Failed to fetch: net::ERR_INTERNET_DISCONNECTED');
      }) as unknown as typeof fetch;

      // 3. Process outbox with failing fetch
      const result = await processOutbox({
        db: testDb,
        fetchFn: failingFetch,
      });

      assert.strictEqual(result.syncedCount, 0);
      assert.ok(result.error);
      assert.ok(result.error.includes('net::ERR_INTERNET_DISCONNECTED'));

      // Verify outbox mutation in Dexie: MUST remain in QUEUED status for future retry
      const updatedItem = await testDb.outbox.get(outboxItem.id);
      assert.ok(updatedItem);
      assert.strictEqual(
        updatedItem.status,
        'QUEUED',
        'Outbox item must be returned to QUEUED state upon network failure'
      );
      assert.strictEqual(
        updatedItem.attempts,
        1,
        'Attempt count must be incremented to 1 after network error'
      );
      assert.ok(
        updatedItem.lastError?.includes('net::ERR_INTERNET_DISCONNECTED'),
        'lastError must record the network error description'
      );

      // 4. Verify exponential backoff delay progression
      assert.strictEqual(calculateExponentialBackoff(0), 0);
      assert.strictEqual(calculateExponentialBackoff(1), 1000); // 1s
      assert.strictEqual(calculateExponentialBackoff(2), 2000); // 2s
      assert.strictEqual(calculateExponentialBackoff(3), 4000); // 4s
      assert.strictEqual(calculateExponentialBackoff(4), 8000); // 8s
      assert.strictEqual(calculateExponentialBackoff(5), 16000); // 16s
      assert.strictEqual(calculateExponentialBackoff(10), 60000); // capped at 60s
    });
  });

  describe('3. Stock Conflict Detection (Concurrent Sale Prevention)', () => {
    it('detects already-sold stock pieces, flags mutation as CONFLICT, and updates local records', async () => {
      const mockPrisma = createMockPrisma();
      const tenantId = 'tenant-sandhya-jaipur';
      const conflictBarcode = 'BC-CONFLICT-RING-01';

      // Seed stock item that is ALREADY SOLD by another terminal / counter
      mockPrisma._state.stockItems.set('stock-item-ring-99', {
        id: 'stock-item-ring-99',
        businessId: tenantId,
        barcode: conflictBarcode,
        title: 'Solitaire Diamond Ring 1.0ct',
        status: 'SOLD', // Piece was already invoiced!
        trayLocation: 'VAULT',
      });

      // Client prepares an offline sale for this same stock piece
      const { outboxItem, clientInvoiceId } = await queueInvoiceMutation(
        {
          businessId: tenantId,
          customerName: 'Late Offline Customer',
          grandTotal: 180000,
          items: [
            {
              stockItemId: 'stock-item-ring-99',
              barcode: conflictBarcode,
              description: 'Solitaire Diamond Ring 1.0ct',
              grossWeight: 4.2,
              itemSubtotal: 180000,
            },
          ],
        },
        [{ method: 'CARD', amount: 180000 }],
        { db: testDb }
      );

      // Run server sync directly with mockPrisma
      const syncResult = await processServerOutboxBatch(
        [
          {
            id: outboxItem.id,
            idempotencyKey: outboxItem.idempotencyKey,
            businessId: tenantId,
            payload: JSON.parse(outboxItem.payloadJson),
          },
        ],
        { prismaClient: mockPrisma, businessId: tenantId }
      );

      assert.strictEqual(syncResult.syncedCount, 0);
      assert.strictEqual(syncResult.results.length, 1);
      assert.strictEqual(
        syncResult.results[0].status,
        'CONFLICT',
        'Server must flag piece conflict as CONFLICT'
      );
      assert.ok(
        syncResult.results[0].error?.includes('already sold'),
        'Conflict error message must specify that piece is already sold'
      );

      // Verify no Invoice was inserted into DB for conflicting item
      assert.strictEqual(
        mockPrisma._state.invoices.size,
        0,
        'No invoice should be generated when piece is in CONFLICT'
      );

      // Now verify client outbox processing when server responds with CONFLICT
      const mockConflictFetch = (async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            syncedCount: 0,
            results: syncResult.results,
          }),
        };
      }) as unknown as typeof fetch;

      await processOutbox({
        db: testDb,
        fetchFn: mockConflictFetch,
      });

      // Verify local Dexie outbox item and local invoice are marked as CONFLICT
      const localInvoice = await testDb.invoices.get(clientInvoiceId);
      const localOutbox = await testDb.outbox.get(outboxItem.id);

      assert.ok(localInvoice);
      assert.ok(localOutbox);
      assert.strictEqual(localInvoice.status, 'CONFLICT');
      assert.strictEqual(localOutbox.status, 'CONFLICT');
      assert.ok(localOutbox.lastError?.includes('already sold'));
    });
  });

  describe('4. Full End-to-End Successful Sync Lifecycle', () => {
    it('successfully syncs queued outbox mutation, updates stock to SOLD, and finalizes invoice', async () => {
      const mockPrisma = createMockPrisma();
      const tenantId = 'tenant-sandhya-jaipur';
      const availableBarcode = 'BC-SOLITAIRE-01';

      // 1. Showcase inventory piece available
      mockPrisma._state.stockItems.set('stock-item-pendant', {
        id: 'stock-item-pendant',
        businessId: tenantId,
        barcode: availableBarcode,
        title: '22K Kundan Polki Pendant',
        status: 'IN_SHOWCASE',
        trayLocation: 'TRAY-PENDANT-04',
      });

      // 2. Queue invoice mutation on client
      const { outboxItem, clientInvoiceId } = await queueInvoiceMutation(
        {
          businessId: tenantId,
          customerName: 'Kavita Rathore',
          customerPhone: '+91 99887 76655',
          grandTotal: 145000,
          subtotal: 145000,
          items: [
            {
              stockItemId: 'stock-item-pendant',
              barcode: availableBarcode,
              description: '22K Kundan Polki Pendant',
              metal: 'GOLD',
              purityKey: '22K',
              grossWeight: 18.0,
              itemSubtotal: 145000,
            },
          ],
        },
        [
          { method: 'CASH', amount: 45000 },
          { method: 'UPI', amount: 100000 },
        ],
        { db: testDb }
      );

      // 3. Mock fetch linking client processOutbox directly to server processing logic
      const mockSyncFetch = (async (url: string, init?: RequestInit) => {
        const reqBody = JSON.parse(String(init?.body || '{}'));
        const serverRes = await processServerOutboxBatch(reqBody.mutations, {
          prismaClient: mockPrisma,
          businessId: tenantId,
        });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            syncedCount: serverRes.syncedCount,
            results: serverRes.results,
          }),
        };
      }) as unknown as typeof fetch;

      // 4. Process outbox
      const processRes = await processOutbox({
        db: testDb,
        fetchFn: mockSyncFetch,
      });

      assert.strictEqual(processRes.processedCount, 1);
      assert.strictEqual(processRes.syncedCount, 1);
      assert.strictEqual(processRes.results[0].status, 'SYNCED');
      const officialNo = processRes.results[0].officialInvoiceNumber;
      assert.ok(officialNo?.startsWith('INV-'));

      // 5. Verify local client records updated to SYNCED
      const updatedInvoice = await testDb.invoices.get(clientInvoiceId);
      const updatedOutbox = await testDb.outbox.get(outboxItem.id);

      assert.strictEqual(updatedInvoice?.status, 'SYNCED');
      assert.strictEqual(updatedInvoice?.officialInvoiceNumber, officialNo);
      assert.ok(updatedInvoice?.syncedAt);
      assert.strictEqual(updatedOutbox?.status, 'SYNCED');

      // 6. Verify server DB state: Stock marked SOLD, StockMovement logged
      const serverStock = mockPrisma._state.stockItems.get('stock-item-pendant');
      assert.strictEqual(serverStock.status, 'SOLD');
      assert.strictEqual(mockPrisma._state.stockMovements.length, 1);
      assert.strictEqual(mockPrisma._state.stockMovements[0].toStatus, 'SOLD');
      assert.strictEqual(mockPrisma._state.invoices.size, 1);
    });
  });

  describe('5. HTTP Route Authentication & Validation', () => {
    it('returns 401 Unauthorized when request lacks session or businessId', async () => {
      const dummyReq = new Request('http://localhost:3000/api/sync/outbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations: [] }),
      });

      const response = await serverOutboxRoutePost(dummyReq);
      assert.strictEqual(response.status, 401);

      const json = await response.json();
      assert.ok(json.error?.includes('Unauthorized'));
    });
  });
});
