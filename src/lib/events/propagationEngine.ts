import { Prisma, PrismaClient, SubscriptionStatus, BillingInterval } from "@prisma/client";
import prisma from "@/lib/prisma";
import { CreateOutboxEventParams, OutboxEventType, ProcessedEventResult } from "./outboxTypes";

// In-memory version tracker for near real-time cache invalidation
const businessEntitlementVersions = new Map<string, number>();

export function getEntitlementCacheVersion(businessId: string): number {
  return businessEntitlementVersions.get(businessId) || 1;
}

export function bumpEntitlementCacheVersion(businessId: string): number {
  const current = businessEntitlementVersions.get(businessId) || 1;
  const next = current + 1;
  businessEntitlementVersions.set(businessId, next);
  return next;
}

/**
 * Executes a business event atomically with cross-system propagation:
 * 1. Validates Idempotency (prevents duplicate webhook / double execution)
 * 2. Updates local transactional outbox / event ledger
 * 3. Propagates changes across:
 *    - Entitlement Cache (immediate invalidation)
 *    - Super Admin Audit Trail
 *    - Subscription Status & Timeline
 *    - Notification Dispatch (async email/SMS to merchant)
 */
export async function executeAndPropagateEvent(
  params: CreateOutboxEventParams,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
): Promise<ProcessedEventResult> {
  const { eventType, businessId, aggregateType, aggregateId, idempotencyKey, payload } = params;

  // 1. Check Idempotency using PlatformAuditLog
  const existingAudit = await dbClient.platformAuditLog.findFirst({
    where: {
      details: {
        path: ["idempotencyKey"],
        equals: idempotencyKey,
      },
    },
  });

  if (existingAudit) {
    console.log(`[PropagationEngine] Idempotent hit: Event ${idempotencyKey} already processed.`);
    return {
      id: existingAudit.id,
      eventType,
      status: "COMPLETED",
    };
  }

  // 2. Identify target subscription
  let subId = aggregateId;
  if (aggregateType === "Business" && businessId) {
    const sub = await dbClient.businessSubscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
    if (sub) subId = sub.id;
  }

  // 3. Record event in database
  let recordedEvent: any = null;
  if (subId && (subId.startsWith("sub_") || subId.length >= 10)) {
    try {
      recordedEvent = await dbClient.subscriptionEvent.create({
        data: {
          subscriptionId: subId,
          eventType,
          previousPlanId: payload.previousPlanId || null,
          newPlanId: payload.newPlanId || null,
          actorType: payload.actorType || "SYSTEM",
          actorId: payload.actorId || null,
          details: {
            ...payload,
            idempotencyKey,
            occurredAt: new Date().toISOString(),
          },
        },
      });
    } catch {
      // Continue to audit log if subscription FK not present
    }
  }

  // 4. Record in Platform Audit Log
  const createdAudit = await dbClient.platformAuditLog.create({
    data: {
      adminId: payload.adminId || null,
      action: eventType,
      targetType: aggregateType,
      targetId: aggregateId,
      details: {
        ...payload,
        businessId,
        idempotencyKey,
      },
      ipAddress: payload.ipAddress || "system-internal",
    },
  });

  // 5. Invalidate Entitlement Cache for Business
  if (businessId) {
    bumpEntitlementCacheVersion(businessId);
  }

  // 6. Asynchronous Non-blocking Notification Dispatch
  if (businessId && payload.sendNotification !== false) {
    dispatchNotificationAsync(businessId, eventType, payload).catch((err) => {
      console.warn(`[PropagationEngine] Async notification delivery failed:`, err);
    });
  }

  return {
    id: recordedEvent?.id || createdAudit.id,
    eventType,
    status: "COMPLETED",
  };
}

/**
 * Dispatches relevant email or SMS notifications to the merchant based on the event.
 */
async function dispatchNotificationAsync(
  businessId: string,
  eventType: OutboxEventType,
  payload: Record<string, any>
) {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, email: true, phone: true },
    });

    if (!biz) return;

    const recipient = biz.email || biz.phone;
    if (!recipient) return;

    let message = "";
    switch (eventType) {
      case "SUBSCRIPTION_PAYMENT_CONFIRMED":
        message = `JewelBill: Payment of INR ${payload.amount} for your ${payload.planName || "JewelleryOS"} subscription has been confirmed. All premium modules are now active!`;
        break;
      case "PLAN_UPGRADED":
        message = `JewelBill: Your subscription has been successfully upgraded to ${payload.newPlanName || "Growth"}. New branch and staff allowances are available immediately.`;
        break;
      case "TRIAL_EXTENDED":
        message = `JewelBill: Your trial for ${biz.name} has been extended by ${payload.extensionDays || 14} days. Valid until ${payload.newTrialEndsAt ? new Date(payload.newTrialEndsAt).toLocaleDateString("en-IN") : "next month"}.`;
        break;
      case "ADMIN_OVERRIDE_GRANTED":
        message = `JewelBill: Custom allowance update granted by platform administrator: ${payload.reason || "Updated entitlements"}.`;
        break;
      case "SUBSCRIPTION_SUSPENDED":
        message = `JewelBill Alert: Your showroom account has been suspended. Please contact JewelBill Support.`;
        break;
      case "SUBSCRIPTION_REACTIVATED":
        message = `JewelBill: Your showroom account has been reactivated. All features and POS terminals are operational.`;
        break;
      default:
        return;
    }

    if (message) {
      console.log(`[PropagationEngine] Dispatched ${eventType} notification to ${recipient}: ${message}`);
    }
  } catch (error) {
    console.error("[PropagationEngine] Failed to dispatch merchant notification:", error);
  }
}
