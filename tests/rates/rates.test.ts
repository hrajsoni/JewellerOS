import { test, describe } from "node:test";
import assert from "node:assert";
import {
  derivePuritiesFrom24k,
  deriveSilver925From999,
  recordNewMetalRates,
  getMetalRatesHistory,
  INITIAL_RATE_HISTORY,
} from "../../src/modules/rates/store";
import { UserSession } from "../../src/modules/auth/types";

describe("JewelleryOS Metal Rate Engine & Audit Ledger Tests", () => {
  const mockOwnerSession: UserSession = {
    id: "user-harshit-owner",
    fullName: "Harshit Raj",
    email: "harshit@sandhyajewellers.com",
    phone: "+91 94140 12345",
    role: "OWNER",
    businessId: "tenant-sandhya-jaipur",
    businessName: "Sandhya Jewellers",
  };

  test("Rate Derivation: Exactly derives 22K, 18K, and 14K from ₹1,50,000 24K benchmark", () => {
    const derived = derivePuritiesFrom24k(150000);
    
    // 22K = (150000 / 24) * 22 = 137500
    assert.strictEqual(derived.gold22k, 137500);

    // 18K = (150000 / 24) * 18 = 112500
    assert.strictEqual(derived.gold18k, 112500);

    // 14K = (150000 / 24) * 14 = 87500
    assert.strictEqual(derived.gold14k, 87500);
  });

  test("Silver Derivation: Exactly normalizes 925 sterling from ₹95,000/kg 999 fine silver", () => {
    const silver925 = deriveSilver925From999(95000);
    // 95000 * 0.925 = 87875
    assert.strictEqual(silver925, 87875);
  });

  test("Validation: Rejects non-positive metal rates", () => {
    const result = recordNewMetalRates(
      {
        gold24k: 0,
        silver999PerKg: -100,
      },
      mockOwnerSession
    );

    assert.ok(result.error);
    assert.match(result.error, /positive numbers/i);
  });

  test("Audit Trail: Records new rate with full employee attribution and timestamp", () => {
    const result = recordNewMetalRates(
      {
        gold24k: 151000,
        silver999PerKg: 96000,
        autoDerivePurities: true,
        notes: "Morning Jaipur Sarafa Bazar Opening",
      },
      mockOwnerSession
    );

    assert.ok(result.record);
    assert.strictEqual(result.record.gold24k, 151000);
    assert.strictEqual(result.record.gold22k, Math.round((151000 / 24) * 22));
    assert.strictEqual(result.record.updatedById, mockOwnerSession.id);
    assert.strictEqual(result.record.updatedByName, "Harshit Raj");
    assert.strictEqual(result.record.updatedByRole, "OWNER");
    assert.strictEqual(result.record.notes, "Morning Jaipur Sarafa Bazar Opening");
    assert.ok(result.record.timestamp);
  });
});
