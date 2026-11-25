import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_USERS,
  loginWithCredentials,
  changeUserPin,
  adminResetPin,
  verifyPin,
  getTenantUsers,
  saveTenantUsers,
  inMemoryUsersCache,
  INITIAL_USER_PINS,
} from "../../src/modules/auth/store";
import { ROLE_PERMISSIONS, hasPermission } from "../../src/modules/auth/permissions";

describe("JewelleryOS Milestone 10: Authentication, Unique Salted PINs & Strict RBAC Tests", () => {
  beforeEach(() => {
    // Clear in-memory caches between runs
    for (const k of Object.keys(inMemoryUsersCache)) {
      delete inMemoryUsersCache[k];
    }
  });

  it("Unique PIN Invariant (DEF-002): Verifies every staff member has a distinct individual PIN", () => {
    const pins = DEFAULT_USERS.map((u) => u.pin);
    const uniquePins = new Set(pins);

    // Assert no two employees share the same PIN
    assert.strictEqual(
      uniquePins.size,
      DEFAULT_USERS.length,
      `Expected ${DEFAULT_USERS.length} unique PINs, but found duplicate PINs across staff accounts.`
    );

    // Verify Owner Harshit Raj has distinct PIN
    const owner = DEFAULT_USERS.find((u) => u.role === "OWNER");
    assert.ok(owner);
    assert.strictEqual(owner.pin, "884219");

    // Verify Manager Sunil Mehta has distinct PIN
    const manager = DEFAULT_USERS.find((u) => u.role === "MANAGER");
    assert.ok(manager);
    assert.strictEqual(manager.pin, "451230");
    assert.notStrictEqual(owner.pin, manager.pin);
  });

  it("Salted Bcrypt Verification: Verifies hash comparison and rejection of common master PIN 1234", () => {
    const owner = DEFAULT_USERS.find((u) => u.id === "user-harshit-owner");
    assert.ok(owner);
    assert.ok(owner.pinHash, "Owner must possess a salted bcrypt hash");

    // Valid PIN verifies successfully
    assert.strictEqual(verifyPin("884219", owner), true);

    // Common/legacy PINs 1234 or 123456 must be rejected
    assert.strictEqual(verifyPin("1234", owner), false);
    assert.strictEqual(verifyPin("123456", owner), false);
    assert.strictEqual(verifyPin("wrong-pin", owner), false);
  });

  it("Staff Credential Login: Authenticates with email or phone and individual PIN", () => {
    const tenantId = "tenant-sandhya-jaipur";

    // 1. Login with Harshit's email and PIN
    const ownerRes = loginWithCredentials(
      {
        emailOrPhone: "harshit@sandhyajewellers.com",
        pinOrPassword: "884219",
      },
      tenantId
    );
    assert.strictEqual(ownerRes.session !== null, true);
    assert.strictEqual(ownerRes.session?.role, "OWNER");
    assert.strictEqual(ownerRes.session?.id, "user-harshit-owner");

    // 2. Login with Ramesh's phone number and unique PIN
    const salesRes = loginWithCredentials(
      {
        emailOrPhone: "+91 94140 98765",
        pinOrPassword: "289910",
      },
      tenantId
    );
    assert.strictEqual(salesRes.session !== null, true);
    assert.strictEqual(salesRes.session?.role, "SALESPERSON");

    // 3. Login attempt with wrong PIN fails
    const failRes = loginWithCredentials(
      {
        emailOrPhone: "harshit@sandhyajewellers.com",
        pinOrPassword: "wrong",
      },
      tenantId
    );
    assert.strictEqual(failRes.session, null);
    assert.strictEqual(failRes.error, "Incorrect security PIN / password.");
  });

  it("Individual PIN Reset: Employee can update PIN with verification of old PIN", () => {
    const tenantId = "tenant-pin-test";

    // Update Sunil's PIN from 451230 to 771122
    const changeRes = changeUserPin("user-sunil-mgr", "451230", "771122", tenantId);
    assert.strictEqual(changeRes.success, true);

    // Old PIN 451230 no longer works
    const oldLogin = loginWithCredentials(
      {
        emailOrPhone: "sunil@sandhyajewellers.com",
        pinOrPassword: "451230",
      },
      tenantId
    );
    assert.strictEqual(oldLogin.session, null);

    // New PIN 771122 works immediately
    const newLogin = loginWithCredentials(
      {
        emailOrPhone: "sunil@sandhyajewellers.com",
        pinOrPassword: "771122",
      },
      tenantId
    );
    assert.strictEqual(newLogin.session !== null, true);
    assert.strictEqual(newLogin.session?.id, "user-sunil-mgr");
  });

  it("Administrative PIN Reset: Owner can reset employee PIN, while unauthorized roles are blocked", () => {
    const tenantId = "tenant-admin-reset";

    // 1. Salesperson attempting admin reset must fail
    const blockedRes = adminResetPin("SALESPERSON", "user-vikram-inv", "999888", tenantId);
    assert.strictEqual(blockedRes.success, false);
    assert.match(blockedRes.error || "", /Unauthorized/);

    // 2. Owner executing admin reset must succeed
    const successRes = adminResetPin("OWNER", "user-vikram-inv", "999888", tenantId);
    assert.strictEqual(successRes.success, true);

    // Verify Vikram can now log in with the new PIN
    const loginRes = loginWithCredentials(
      {
        emailOrPhone: "vikram@sandhyajewellers.com",
        pinOrPassword: "999888",
      },
      tenantId
    );
    assert.strictEqual(loginRes.session !== null, true);
  });

  it("Strict RBAC Enforcement (DEF-001): Prohibits unprivileged roles from accessing confidential data", () => {
    // 1. Salespersons must NEVER view purchase costs or profit margins
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_PURCHASE_COSTS"), false);
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_PROFIT_MARGINS"), false);
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_OWNER_REPORTS"), false);
    assert.strictEqual(hasPermission("SALESPERSON", "DELETE_RECORDS"), false);
    // Salespersons can bill
    assert.strictEqual(hasPermission("SALESPERSON", "FINALIZE_RETAIL_BILL"), true);

    // 2. Karigar Manager cannot see purchase costs or finance
    assert.strictEqual(hasPermission("KARIGAR_MANAGER", "VIEW_PURCHASE_COSTS"), false);
    assert.strictEqual(hasPermission("KARIGAR_MANAGER", "VIEW_OWNER_REPORTS"), false);
    assert.strictEqual(hasPermission("KARIGAR_MANAGER", "MANAGE_KARIGAR"), true);

    // 3. Store Manager can view purchase costs, but NOT owner profit margins or reports
    assert.strictEqual(hasPermission("MANAGER", "VIEW_PURCHASE_COSTS"), true);
    assert.strictEqual(hasPermission("MANAGER", "VIEW_PROFIT_MARGINS"), false);
    assert.strictEqual(hasPermission("MANAGER", "VIEW_OWNER_REPORTS"), false);

    // 4. Owner has full uninhibited access
    assert.strictEqual(hasPermission("OWNER", "VIEW_PURCHASE_COSTS"), true);
    assert.strictEqual(hasPermission("OWNER", "VIEW_PROFIT_MARGINS"), true);
    assert.strictEqual(hasPermission("OWNER", "VIEW_OWNER_REPORTS"), true);
    assert.strictEqual(hasPermission("OWNER", "DELETE_RECORDS"), true);
  });

  it("Multi-Tenant Staff Isolation: Modifying staff in one tenant does not leak into another tenant", () => {
    const tenantJaipur = "tenant-sandhya-jaipur";
    const tenantMumbai = "tenant-zhaveri-mumbai";

    // Change Harshit's PIN in Mumbai showroom only
    changeUserPin("user-harshit-owner", "884219", "555111", tenantMumbai);

    // Jaipur showroom still has original PIN 884219
    const jaipurLogin = loginWithCredentials(
      { emailOrPhone: "harshit@sandhyajewellers.com", pinOrPassword: "884219" },
      tenantJaipur
    );
    assert.strictEqual(jaipurLogin.session !== null, true);

    // Mumbai showroom has new PIN 555111
    const mumbaiLogin = loginWithCredentials(
      { emailOrPhone: "harshit@sandhyajewellers.com", pinOrPassword: "555111" },
      tenantMumbai
    );
    assert.strictEqual(mumbaiLogin.session !== null, true);
  });
});
