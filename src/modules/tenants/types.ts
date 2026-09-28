export interface JewellerTenant {
  id: string;
  businessName: string;
  ownerName: string;
  tagline?: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  gstin: string;
  bisLicense?: string;
  defaultGoldRate: number; // 24K per 10g
  defaultSilverRate: number; // per kg
  defaultMakingPercentage: number;
  currency: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface RegisterJewellerInput {
  businessName: string;
  ownerName: string;
  tagline?: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  gstin: string;
  bisLicense?: string;
  defaultGoldRate?: number;
  defaultSilverRate?: number;
  defaultMakingPercentage?: number;
}
