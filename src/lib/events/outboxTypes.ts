export type OutboxEventType =
  | "REGISTRATION_COMPLETED"
  | "SUBSCRIPTION_PAYMENT_CONFIRMED"
  | "SUBSCRIPTION_PAYMENT_FAILED"
  | "PLAN_UPGRADED"
  | "PLAN_DOWNGRADED"
  | "ADDON_ACTIVATED"
  | "ADMIN_OVERRIDE_GRANTED"
  | "TRIAL_EXTENDED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_REACTIVATED"
  | "REFUND_PROCESSED";

export type OutboxStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "DEAD_LETTER";

export interface CreateOutboxEventParams {
  eventType: OutboxEventType;
  businessId?: string | null;
  aggregateType: "Business" | "Subscription" | "Payment" | "Entitlement" | "Plan";
  aggregateId: string;
  idempotencyKey: string;
  payload: Record<string, any>;
}

export interface ProcessedEventResult {
  id: string;
  eventType: OutboxEventType;
  status: "COMPLETED" | "FAILED";
  error?: string;
}
