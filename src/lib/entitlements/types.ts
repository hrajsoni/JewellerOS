import { SubscriptionStatus, BillingInterval } from "@prisma/client";

export interface FeatureAccessResult {
  allowed: boolean;
  featureKey: string;
  reason?: string;
  requiredPlan?: string;
  subscriptionStatus?: SubscriptionStatus;
}

export interface ResourceLimitResult {
  allowed: boolean;
  metricKey: string;
  current: number;
  limit: number;
  remaining: number;
  unit: string;
  reason?: string;
}

export interface BusinessEntitlementSummary {
  businessId: string;
  businessName: string;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    billingInterval: BillingInterval;
    planName: string;
    planSlug: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    isTrial: boolean;
    daysRemaining: number;
  } | null;
  features: Record<string, boolean>;
  limits: Record<
    string,
    {
      current: number;
      limit: number;
      remaining: number;
      unit: string;
      percentage: number;
    }
  >;
  overridesCount: number;
}
