import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkFeatureAccess,
  checkUsageLimit,
  getBusinessEntitlementSummary,
} from "../src/lib/entitlements/service";
import prisma from "../src/lib/prisma";

describe("JewelBill Entitlement & Allowance Engine Tests", () => {
  const testBusinessId = "tenant-sandhya-jaipur";

  it("allows core POS and inventory access for active Growth business", async () => {
    const posAccess = await checkFeatureAccess(testBusinessId, "module.pos", prisma);
    const invAccess = await checkFeatureAccess(testBusinessId, "module.inventory", prisma);

    assert.equal(posAccess.allowed, true);
    assert.equal(invAccess.allowed, true);
  });

  it("allows Girvi and Karigar modules for Growth tier", async () => {
    const girvi = await checkFeatureAccess(testBusinessId, "module.girvi", prisma);
    const karigar = await checkFeatureAccess(testBusinessId, "module.karigar", prisma);

    assert.equal(girvi.allowed, true);
    assert.equal(karigar.allowed, true);
  });

  it("checks staff seats usage limit against active accounts", async () => {
    const staffQuota = await checkUsageLimit(testBusinessId, "limit.staff_seats", 1, prisma);

    assert.equal(staffQuota.metricKey, "limit.staff_seats");
    assert.ok(staffQuota.limit >= 10, "Growth plan has at least 10 staff seats");
    assert.ok(staffQuota.current >= 1, "There is at least 1 user in Sandhya Jewellers");
    assert.ok(staffQuota.remaining >= 0, "Remaining seats should be non-negative");
    assert.equal(staffQuota.allowed, true, "Should allow adding another staff seat within quota");
  });

  it("checks branch usage limit", async () => {
    const branchQuota = await checkUsageLimit(testBusinessId, "limit.branches", 1, prisma);

    assert.equal(branchQuota.metricKey, "limit.branches");
    assert.ok(branchQuota.limit >= 3, "Growth plan provides at least 3 branches");
    assert.ok(branchQuota.current >= 1, "Current showroom branch is tracked");
    assert.equal(branchQuota.allowed, true);
  });

  it("generates comprehensive entitlement summary for merchant dashboard", async () => {
    const summary = await getBusinessEntitlementSummary(testBusinessId, prisma);

    assert.equal(summary.businessId, testBusinessId);
    assert.equal(summary.businessName, "Sandhya Jewellers");
    assert.ok(summary.subscription !== null, "Has active subscription");
    assert.equal(summary.subscription?.planSlug, "growth");
    assert.equal(summary.features["module.pos"], true);
    assert.equal(summary.features["module.girvi"], true);
    assert.ok(summary.limits["limit.staff_seats"] !== undefined);
  });
});
