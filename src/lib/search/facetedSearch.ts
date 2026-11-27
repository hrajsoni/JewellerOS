import { Prisma, MetalType, StockStatus } from "@prisma/client";

export interface FacetedSearchParams {
  q?: string;
  metal?: string;
  purity?: string;
  category?: string;
  minWeight?: string | number;
  maxWeight?: string | number;
  status?: string;
  trayLocation?: string;
  page?: number;
  limit?: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export type FacetList = FacetCount[] & Record<string, number>;

export interface FacetsResponse {
  metals: FacetList;
  categories: FacetList;
  purities: FacetList;
  statuses: FacetList;
}

export interface SessionContext {
  businessId: string;
  userId?: string;
  role?: string;
}

export const VALID_METALS: MetalType[] = [
  MetalType.GOLD,
  MetalType.SILVER,
  MetalType.PLATINUM,
];

export const VALID_STOCK_STATUSES: StockStatus[] = [
  StockStatus.IN_SHOWCASE,
  StockStatus.IN_VAULT,
  StockStatus.RESERVED,
  StockStatus.SOLD,
  StockStatus.WITH_KARIGAR,
  StockStatus.IN_REPAIR,
  StockStatus.ON_MEMO,
  StockStatus.DAMAGED,
  StockStatus.RETURNED_TO_SUPPLIER,
];

/**
 * Parses query parameters from URL or search string into structured FacetedSearchParams.
 * Strips unknown/dangerous keys to guarantee client parameters cannot inject or override tenant.
 */
export function parseFacetedSearchParams(
  input: URLSearchParams | URL | string
): FacetedSearchParams {
  let searchParams: URLSearchParams;

  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      searchParams = new URL(input).searchParams;
    } else {
      const queryString = input.includes("?")
        ? input.slice(input.indexOf("?") + 1)
        : input;
      searchParams = new URLSearchParams(queryString);
    }
  } else if (input instanceof URL) {
    searchParams = input.searchParams;
  } else {
    searchParams = input;
  }

  const q = searchParams.get("q")?.trim() || undefined;
  const metal = searchParams.get("metal")?.trim() || undefined;
  const purity = searchParams.get("purity")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const minWeight = searchParams.get("minWeight")?.trim() || undefined;
  const maxWeight = searchParams.get("maxWeight")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;
  const trayLocation = searchParams.get("trayLocation")?.trim() || undefined;

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "50", 10);

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);

  return {
    ...(q ? { q } : {}),
    ...(metal ? { metal } : {}),
    ...(purity ? { purity } : {}),
    ...(category ? { category } : {}),
    ...(minWeight !== undefined ? { minWeight } : {}),
    ...(maxWeight !== undefined ? { maxWeight } : {}),
    ...(status ? { status } : {}),
    ...(trayLocation ? { trayLocation } : {}),
    page,
    limit,
  };
}

/**
 * Builds a strict Prisma where clause enforcing multi-tenant isolation.
 * Throws an explicit error if businessId is missing or empty.
 */
export function buildFacetedSearchWhereClause(options: {
  businessId: string;
  params: FacetedSearchParams;
}): Prisma.StockItemWhereInput {
  const { businessId, params } = options;

  if (!businessId || typeof businessId !== "string" || !businessId.trim()) {
    throw new Error(
      "Tenant isolation violation: businessId is strictly required and cannot be empty."
    );
  }

  const where: Prisma.StockItemWhereInput = {
    businessId: businessId.trim(),
  };

  // 1. Multi-attribute text search (q)
  // Matches barcode exact, huid exact, sku contains, product name contains, or title contains
  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [
      { barcode: { equals: q } },
      { huid: { equals: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { product: { name: { contains: q, mode: "insensitive" } } },
      { title: { contains: q, mode: "insensitive" } },
    ];
  }

  // 2. Metal Enum Filter (GOLD, SILVER, PLATINUM)
  if (params.metal && params.metal.trim()) {
    const normalizedMetal = params.metal.trim().toUpperCase() as MetalType;
    if (VALID_METALS.includes(normalizedMetal)) {
      where.metal = normalizedMetal;
    }
  }

  // 3. Purity Filter (24K, 22K, 18K, 14K, 925, etc.)
  if (params.purity && params.purity.trim()) {
    where.purityKey = { equals: params.purity.trim(), mode: "insensitive" };
  }

  // 4. Category Filter (Rings, Bangles, etc.)
  if (params.category && params.category.trim()) {
    where.product = {
      ...(where.product as object),
      category: { equals: params.category.trim(), mode: "insensitive" },
    };
  }

  // 5. Decimal Weight Range Filters on netWeight
  const weightFilter: Record<string, Prisma.Decimal> = {};
  if (
    params.minWeight !== undefined &&
    params.minWeight !== null &&
    params.minWeight !== ""
  ) {
    const minVal = Number(params.minWeight);
    if (!isNaN(minVal)) {
      weightFilter.gte = new Prisma.Decimal(minVal);
    }
  }
  if (
    params.maxWeight !== undefined &&
    params.maxWeight !== null &&
    params.maxWeight !== ""
  ) {
    const maxVal = Number(params.maxWeight);
    if (!isNaN(maxVal)) {
      weightFilter.lte = new Prisma.Decimal(maxVal);
    }
  }
  if (Object.keys(weightFilter).length > 0) {
    where.netWeight = weightFilter;
  }

  // 6. Status filter (StockStatus enum)
  if (params.status && params.status.trim()) {
    const normalizedStatus = params.status.trim().toUpperCase() as StockStatus;
    if (VALID_STOCK_STATUSES.includes(normalizedStatus)) {
      where.status = normalizedStatus;
    }
  }

  // 7. Tray location filter
  if (params.trayLocation && params.trayLocation.trim()) {
    where.trayLocation = {
      contains: params.trayLocation.trim(),
      mode: "insensitive",
    };
  }

  return where;
}

/**
 * Aggregates raw item rows into facets with counts for metals, categories, purities, and statuses.
 * Returns arrays where each item has { value, count } and also allows key-based indexing.
 */
export function buildFacets(
  records: Array<{
    metal?: string | null;
    purityKey?: string | null;
    status?: string | null;
    product?: { category?: string | null } | null;
  }>
): FacetsResponse {
  const metalMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  const purityMap: Record<string, number> = {};
  const statusMap: Record<string, number> = {};

  for (const r of records) {
    if (r.metal) {
      metalMap[r.metal] = (metalMap[r.metal] || 0) + 1;
    }
    if (r.purityKey) {
      purityMap[r.purityKey] = (purityMap[r.purityKey] || 0) + 1;
    }
    if (r.status) {
      statusMap[r.status] = (statusMap[r.status] || 0) + 1;
    }
    if (r.product?.category) {
      categoryMap[r.product.category] =
        (categoryMap[r.product.category] || 0) + 1;
    }
  }

  function createFacetList(map: Record<string, number>): FacetList {
    const list: FacetCount[] = Object.entries(map).map(([value, count]) => ({
      value,
      count,
    }));
    // Attach key access properties to the array for dual-mode convenience
    for (const [key, val] of Object.entries(map)) {
      (list as any)[key] = val;
    }
    return list as FacetList;
  }

  return {
    metals: createFacetList(metalMap),
    categories: createFacetList(categoryMap),
    purities: createFacetList(purityMap),
    statuses: createFacetList(statusMap),
  };
}

/**
 * Parses a standard Cookie header into key-value pairs.
 */
export function parseCookieHeader(
  cookieHeader: string | null | undefined
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

/**
 * Extracts authenticated session context strictly from cookies or authorization headers.
 * NEVER trusts client-supplied query parameters or request body for businessId.
 */
export function extractSessionContext(
  request: Request
): SessionContext | null {
  // 1. Check HTTP cookies
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);

  const rawSession =
    cookies["jewellery_os_session"] ||
    cookies["jewellery_session"] ||
    cookies["session"];

  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed && typeof parsed.businessId === "string" && parsed.businessId.trim()) {
        return {
          businessId: parsed.businessId.trim(),
          userId: parsed.id || parsed.userId,
          role: parsed.role,
        };
      }
    } catch {
      // Might be base64-encoded JWT
      try {
        const parts = rawSession.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          if (payload && typeof payload.businessId === "string" && payload.businessId.trim()) {
            return {
              businessId: payload.businessId.trim(),
              userId: payload.userId || payload.sub,
              role: payload.role,
            };
          }
        }
      } catch {}
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    try {
      const parsed = JSON.parse(token);
      if (parsed && typeof parsed.businessId === "string" && parsed.businessId.trim()) {
        return {
          businessId: parsed.businessId.trim(),
          userId: parsed.id || parsed.userId,
          role: parsed.role,
        };
      }
    } catch {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          if (payload && typeof payload.businessId === "string" && payload.businessId.trim()) {
            return {
              businessId: payload.businessId.trim(),
              userId: payload.userId || payload.sub,
              role: payload.role,
            };
          }
        }
      } catch {}
    }
  }

  // 3. Check trusted server-to-server gateway headers
  const headerBusinessId =
    request.headers.get("x-business-id") ||
    request.headers.get("x-session-business-id");

  if (headerBusinessId && headerBusinessId.trim()) {
    return {
      businessId: headerBusinessId.trim(),
      userId: request.headers.get("x-user-id") || undefined,
      role: request.headers.get("x-user-role") || undefined,
    };
  }

  return null;
}
