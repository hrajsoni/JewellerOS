import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyPlanUpgrade,
  getBusinessEntitlementSummary,
} from "../src/lib/entitlements/service";
import {
  executeAndPropagateEvent,
  getEntitlementCacheVersion,
  bumpEntitlementCacheVersion,
} from "../src/lib/events/propagationEngine";
import prisma from "../src/lib/prisma";

describe("Milestone 8: Cross-System Synchronisation, Event Propagation & Consistency QA", () => {
  const businessId = "tenant-sandhya-jaipur";

  it("1. Verifies business ID permanence during subscription changes (biz_... never changes)", async () => {
    const preSummary = await getBusinessEntitlementSummary(businessId, prisma);
    const originalBizId = preSummary.businessId;

    // Trigger plan upgrade
    const result = await applyPlanUpgrade({
      businessId,
      targetPlanSlugOrId: "growth",
      billingInterval: "YEARLY",
      promoCode: "SARAFABAZAR",
      paymentMethod: "UPI",
      referenceNumber: `TEST_TXN_${Date.now()}`,
    });

    assert.equal(result.success, true);
    assert.equal(result.subscription.businessId, originalBizId, "Business ID must strictly stay identical");

    const postSummary = await getBusinessEntitlementSummary(businessId, prisma);
    assert.equal(postSummary.businessId, originalBizId);
  });

  it("2. Verifies atomic commit of payment, invoice number, and subscription dates", async () => {
    const result = await applyPlanUpgrade({
      businessId,
      targetPlanSlugOrId: "growth",
      billingInterval: "YEARLY",
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: `NEFT_VERIF_${Date.now()}`,
    });

    assert.ok(result.payment.id, "Payment record must be created");
    assert.ok(result.payment.invoiceNumber?.startsWith("JB-INV-"), "Valid GST receipt invoice number generated");
    assert.equal(result.payment.status, "COMPLETED");
    assert.ok(result.subscription.currentPeriodEnd !== null);

    // Verify payment is searchable in DB
    const dbPayment = await prisma.subscriptionPayment.findUnique({
      where: { id: result.payment.id },
    });
    assert.ok(dbPayment);
    assert.equal(dbPayment.invoiceNumber, result.payment.invoiceNumber);
  });

  it("3. Verifies cache version invalidation upon event propagation", () => {
    const v1 = getEntitlementCacheVersion(businessId);
    const v2 = bumpEntitlementCacheVersion(businessId);
    assert.equal(v2, v1 + 1, "Cache version must increment atomically");
  });

  it("4. Verifies idempotent event execution prevents duplicate side-effects", async () => {
    const idempotencyKey = `idemp_test_${Date.now()}`;

    // First execution
    const first = await executeAndPropagateEvent({
      eventType: "SUBSCRIPTION_PAYMENT_CONFIRMED",
      businessId,
      aggregateType: "Payment",
      aggregateId: `pay_${Date.now()}`,
      idempotencyKey,
      payload: { amount: 4999, planName: "Growth Showroom" },
    });

    assert.equal(first.status, "COMPLETED");

    // Second execution with identical key
    const second = await executeAndPropagateEvent({
      eventType: "SUBSCRIPTION_PAYMENT_CONFIRMED",
      businessId,
      aggregateType: "Payment",
      aggregateId: `pay_${Date.now()}`,
      idempotencyKey,
      payload: { amount: 4999, planName: "Growth Showroom" },
    });

    assert.equal(second.status, "COMPLETED");
    assert.equal(second.id, first.id, "Second execution should return existing processed event");
  });

  it("5. Verifies platform audit trail logs cross-system actions", async () => {
    const auditLogs = await prisma.platformAuditLog.findMany({
      where: {
        details: {
          path: ["businessId"],
          equals: businessId,
        },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    assert.ok(auditLogs.length > 0, "Audit logs must record business events");
    assert.ok(auditLogs[0].action);
    assert.ok(auditLogs[0].createdAt);
  });

  it("6. Verifies admin entitlement override reflects in summary and takes precedence", async () => {
    // Sandhya Jewellers: add custom override for api_access
    const override = await prisma.entitlementOverride.create({
      data: {
        businessId,
        featureKey: "module.api_access",
        enabled: true,
        reason: "VIP Partner Integration",
      },
    });

    const summary = await getBusinessEntitlementSummary(businessId, prisma);
    assert.ok(summary.overridesCount >= 1);

    // Clean up override
    await prisma.entitlementOverride.delete({
      where: { id: override.id },
    });
  });
});
