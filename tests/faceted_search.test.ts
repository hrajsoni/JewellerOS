import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Prisma, MetalType, StockStatus } from "@prisma/client";
import {
  parseFacetedSearchParams,
  buildFacetedSearchWhereClause,
  buildFacets,
  extractSessionContext,
  FacetedSearchParams,
} from "../src/lib/search/facetedSearch";

describe("JewelleryOS Faceted Search & Command Palette Engine Tests", () => {
  const mockTenantId = "tenant-sandhya-jaipur";
  const competingTenantId = "tenant-tanishq-mumbai";

  // ==========================================
  // 1. PARAMETER PARSER TESTS
  // ==========================================
  describe("Faceted Search Parameter Parser", () => {
    test("Parser: Returns default values for empty search parameters", () => {
      const params = parseFacetedSearchParams("");
      assert.strictEqual(params.q, undefined);
      assert.strictEqual(params.metal, undefined);
      assert.strictEqual(params.purity, undefined);
      assert.strictEqual(params.category, undefined);
      assert.strictEqual(params.minWeight, undefined);
      assert.strictEqual(params.maxWeight, undefined);
      assert.strictEqual(params.status, undefined);
      assert.strictEqual(params.trayLocation, undefined);
      assert.strictEqual(params.page, 1);
      assert.strictEqual(params.limit, 50);
    });

    test("Parser: Accurately parses full multi-attribute query string", () => {
      const query =
        "q=Solitaire&metal=GOLD&purity=22K&category=Rings&minWeight=3.5&maxWeight=8.0&status=IN_SHOWCASE&trayLocation=Showcase%20Tray%20%231&page=2&limit=25";
      const params = parseFacetedSearchParams(query);

      assert.strictEqual(params.q, "Solitaire");
      assert.strictEqual(params.metal, "GOLD");
      assert.strictEqual(params.purity, "22K");
      assert.strictEqual(params.category, "Rings");
      assert.strictEqual(params.minWeight, "3.5");
      assert.strictEqual(params.maxWeight, "8.0");
      assert.strictEqual(params.status, "IN_SHOWCASE");
      assert.strictEqual(params.trayLocation, "Showcase Tray #1");
      assert.strictEqual(params.page, 2);
      assert.strictEqual(params.limit, 25);
    });

    test("Parser: Trims leading and trailing whitespace from filter values", () => {
      const query = "q=%20%20Necklace%20%20&metal=%20gold%20&purity=%2018K%20";
      const params = parseFacetedSearchParams(query);

      assert.strictEqual(params.q, "Necklace");
      assert.strictEqual(params.metal, "gold");
      assert.strictEqual(params.purity, "18K");
    });

    test("Parser: Restricts page and limit bounds to valid ranges", () => {
      const negativeParams = parseFacetedSearchParams("page=-5&limit=-10");
      assert.strictEqual(negativeParams.page, 1);
      assert.strictEqual(negativeParams.limit, 50);

      const excessiveParams = parseFacetedSearchParams("page=1&limit=5000");
      assert.strictEqual(excessiveParams.limit, 200, "Limit must be capped at 200 items per page");
    });

    test("Parser: Strips client-supplied businessId from search parameters", () => {
      const untrustedQuery = "q=Bangles&businessId=malicious-tenant-injection";
      const params = parseFacetedSearchParams(untrustedQuery);

      assert.strictEqual(
        (params as Record<string, unknown>).businessId,
        undefined,
        "businessId must never be accepted from client search params"
      );
    });
  });

  // ==========================================
  // 2. MULTI-TENANT ISOLATION TESTS
  // ==========================================
  describe("Strict Multi-Tenant Isolation & Security Invariants", () => {
    test("Tenant Isolation: Throws an exception when businessId is missing or empty", () => {
      assert.throws(
        () => {
          buildFacetedSearchWhereClause({
            businessId: "",
            params: { q: "Ring" },
          });
        },
        /Tenant isolation violation: businessId is strictly required/
      );

      assert.throws(
        () => {
          buildFacetedSearchWhereClause({
            businessId: "   ",
            params: {},
          });
        },
        /Tenant isolation violation: businessId is strictly required/
      );
    });

    test("Tenant Isolation: Injects authenticated businessId into Prisma where clause", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { q: "Chain" },
      });

      assert.strictEqual(where.businessId, mockTenantId);
    });

    test("Zero Cross-Tenant Leakage: Separate queries for competing tenants yield strictly isolated where clauses", () => {
      const whereShowroomA = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { category: "Bangles", metal: "GOLD" },
      });

      const whereShowroomB = buildFacetedSearchWhereClause({
        businessId: competingTenantId,
        params: { category: "Bangles", metal: "GOLD" },
      });

      assert.strictEqual(whereShowroomA.businessId, "tenant-sandhya-jaipur");
      assert.strictEqual(whereShowroomB.businessId, "tenant-tanishq-mumbai");
      assert.notStrictEqual(whereShowroomA.businessId, whereShowroomB.businessId);
    });
  });

  // ==========================================
  // 3. BARCODE EXACT MATCH & TEXT SEARCH LOGIC
  // ==========================================
  describe("Barcode Exact Match & Search String (q) Logic", () => {
    test("Barcode Exact Match: Matches barcode exactly and constructs OR criteria", () => {
      const barcodeQuery = "8900000001";
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { q: barcodeQuery },
      });

      assert.ok(Array.isArray(where.OR), "where.OR must be an array");
      assert.strictEqual(where.OR.length, 5);

      // 1. Exact barcode match
      assert.deepStrictEqual(where.OR[0], {
        barcode: { equals: "8900000001" },
      });

      // 2. Exact HUID match
      assert.deepStrictEqual(where.OR[1], {
        huid: { equals: "8900000001", mode: "insensitive" },
      });

      // 3. SKU contains match
      assert.deepStrictEqual(where.OR[2], {
        sku: { contains: "8900000001", mode: "insensitive" },
      });

      // 4. Product name contains match
      assert.deepStrictEqual(where.OR[3], {
        product: { name: { contains: "8900000001", mode: "insensitive" } },
      });

      // 5. Stock item title contains match
      assert.deepStrictEqual(where.OR[4], {
        title: { contains: "8900000001", mode: "insensitive" },
      });
    });

    test("HUID Hallmark Exact Match: Matches 6-character alphanumeric BIS HUID", () => {
      const huidCode = "AB12CD";
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { q: huidCode },
      });

      assert.ok(where.OR);
      const huidFilter = where.OR[1];
      assert.deepStrictEqual(huidFilter, {
        huid: { equals: "AB12CD", mode: "insensitive" },
      });
    });

    test("No OR clause generated when q is absent or whitespace only", () => {
      const whereWithoutQ = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { metal: "GOLD" },
      });
      assert.strictEqual(whereWithoutQ.OR, undefined);

      const whereWithWhitespaceQ = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { q: "   " },
      });
      assert.strictEqual(whereWithWhitespaceQ.OR, undefined);
    });
  });

  // ==========================================
  // 4. WEIGHT RANGE DECIMAL FILTERS
  // ==========================================
  describe("Decimal Weight Range Filters on netWeight", () => {
    test("Weight Filter: Applies minWeight (gte) as Prisma.Decimal", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { minWeight: 14.5 },
      });

      assert.ok(where.netWeight);
      const netWeight = where.netWeight as { gte?: Prisma.Decimal; lte?: Prisma.Decimal };
      assert.ok(netWeight.gte);
      assert.strictEqual(netWeight.gte.toNumber(), 14.5);
      assert.strictEqual(netWeight.lte, undefined);
    });

    test("Weight Filter: Applies maxWeight (lte) as Prisma.Decimal", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { maxWeight: "42.100" },
      });

      assert.ok(where.netWeight);
      const netWeight = where.netWeight as { gte?: Prisma.Decimal; lte?: Prisma.Decimal };
      assert.ok(netWeight.lte);
      assert.strictEqual(netWeight.lte.toNumber(), 42.1);
      assert.strictEqual(netWeight.gte, undefined);
    });

    test("Weight Range: Applies both minWeight and maxWeight concurrently", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { minWeight: 5.0, maxWeight: 10.0 },
      });

      assert.ok(where.netWeight);
      const netWeight = where.netWeight as { gte: Prisma.Decimal; lte: Prisma.Decimal };
      assert.strictEqual(netWeight.gte.toNumber(), 5.0);
      assert.strictEqual(netWeight.lte.toNumber(), 10.0);
    });

    test("Weight Filter: Safely handles non-numeric or malformed weight inputs without crashing", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { minWeight: "not-a-number", maxWeight: "" },
      });

      assert.strictEqual(where.netWeight, undefined);
    });
  });

  // ==========================================
  // 5. FACET FILTERS (METAL, PURITY, CATEGORY, STATUS, TRAY)
  // ==========================================
  describe("Facet Dimension Filters", () => {
    test("Metal Filter: Normalizes metal enum (GOLD, SILVER, PLATINUM)", () => {
      const goldWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { metal: "gold" },
      });
      assert.strictEqual(goldWhere.metal, MetalType.GOLD);

      const silverWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { metal: "SILVER" },
      });
      assert.strictEqual(silverWhere.metal, MetalType.SILVER);

      const platWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { metal: "Platinum" },
      });
      assert.strictEqual(platWhere.metal, MetalType.PLATINUM);

      // Discards invalid metal enum
      const invalidWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { metal: "COPPER" },
      });
      assert.strictEqual(invalidWhere.metal, undefined);
    });

    test("Purity Filter: Matches purityKey case-insensitively", () => {
      const where22K = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { purity: "22K" },
      });
      assert.deepStrictEqual(where22K.purityKey, {
        equals: "22K",
        mode: "insensitive",
      });

      const where925 = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { purity: "925" },
      });
      assert.deepStrictEqual(where925.purityKey, {
        equals: "925",
        mode: "insensitive",
      });
    });

    test("Category Filter: Relates to product.category", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { category: "Bangles & Kadas" },
      });

      assert.ok(where.product);
      assert.deepStrictEqual((where.product as Record<string, unknown>).category, {
        equals: "Bangles & Kadas",
        mode: "insensitive",
      });
    });

    test("Status Filter: Normalizes and validates StockStatus enum", () => {
      const showcaseWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { status: "in_showcase" },
      });
      assert.strictEqual(showcaseWhere.status, StockStatus.IN_SHOWCASE);

      const vaultWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { status: "IN_VAULT" },
      });
      assert.strictEqual(vaultWhere.status, StockStatus.IN_VAULT);

      const memoWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { status: "on_memo" },
      });
      assert.strictEqual(memoWhere.status, StockStatus.ON_MEMO);

      // Discard invalid status
      const invalidWhere = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { status: "LOST_SOMEWHERE" },
      });
      assert.strictEqual(invalidWhere.status, undefined);
    });

    test("Tray Location Filter: Matches tray location substring case-insensitively", () => {
      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: { trayLocation: "Tray-G12" },
      });

      assert.deepStrictEqual(where.trayLocation, {
        contains: "Tray-G12",
        mode: "insensitive",
      });
    });
  });

  // ==========================================
  // 6. MULTI-ATTRIBUTE COMBINED QUERY
  // ==========================================
  describe("Multi-Attribute Combined Faceted Search Query", () => {
    test("Combined Query: Correctly unifies all facets into non-conflicting Prisma where criteria", () => {
      const searchOptions: FacetedSearchParams = {
        q: "Kundan",
        metal: "GOLD",
        purity: "22K",
        category: "Necklaces",
        minWeight: 20.0,
        maxWeight: 50.0,
        status: "IN_SHOWCASE",
        trayLocation: "Vault Safe #A",
      };

      const where = buildFacetedSearchWhereClause({
        businessId: mockTenantId,
        params: searchOptions,
      });

      assert.strictEqual(where.businessId, mockTenantId);
      assert.ok(where.OR && where.OR.length === 5);
      assert.strictEqual(where.metal, MetalType.GOLD);
      assert.deepStrictEqual(where.purityKey, { equals: "22K", mode: "insensitive" });
      assert.deepStrictEqual((where.product as Record<string, unknown>).category, {
        equals: "Necklaces",
        mode: "insensitive",
      });
      assert.strictEqual(where.status, StockStatus.IN_SHOWCASE);
      assert.deepStrictEqual(where.trayLocation, {
        contains: "Vault Safe #A",
        mode: "insensitive",
      });

      const netWeight = where.netWeight as { gte: Prisma.Decimal; lte: Prisma.Decimal };
      assert.strictEqual(netWeight.gte.toNumber(), 20.0);
      assert.strictEqual(netWeight.lte.toNumber(), 50.0);
    });
  });

  // ==========================================
  // 7. FACET AGGREGATION ENGINE
  // ==========================================
  describe("Facets Calculation Aggregator", () => {
    test("Facets: Accurately counts distinct metals, categories, purities, and statuses", () => {
      const mockItems = [
        {
          metal: "GOLD",
          purityKey: "22K",
          status: "IN_SHOWCASE",
          product: { category: "Rings" },
        },
        {
          metal: "GOLD",
          purityKey: "18K",
          status: "IN_SHOWCASE",
          product: { category: "Rings" },
        },
        {
          metal: "SILVER",
          purityKey: "925",
          status: "IN_VAULT",
          product: { category: "Utensils" },
        },
        {
          metal: "GOLD",
          purityKey: "22K",
          status: "WITH_KARIGAR",
          product: { category: "Bangles" },
        },
      ];

      const facets = buildFacets(mockItems);

      // Array structure check
      assert.ok(Array.isArray(facets.metals));
      assert.ok(Array.isArray(facets.categories));
      assert.ok(Array.isArray(facets.purities));
      assert.ok(Array.isArray(facets.statuses));

      // Dual-mode direct property lookup check
      assert.strictEqual(facets.metals["GOLD"], 3);
      assert.strictEqual(facets.metals["SILVER"], 1);

      assert.strictEqual(facets.purities["22K"], 2);
      assert.strictEqual(facets.purities["18K"], 1);
      assert.strictEqual(facets.purities["925"], 1);

      assert.strictEqual(facets.categories["Rings"], 2);
      assert.strictEqual(facets.categories["Utensils"], 1);
      assert.strictEqual(facets.categories["Bangles"], 1);

      assert.strictEqual(facets.statuses["IN_SHOWCASE"], 2);
      assert.strictEqual(facets.statuses["IN_VAULT"], 1);
      assert.strictEqual(facets.statuses["WITH_KARIGAR"], 1);

      // Item array check
      const goldItem = facets.metals.find((f) => f.value === "GOLD");
      assert.ok(goldItem);
      assert.strictEqual(goldItem.count, 3);
    });
  });

  // ==========================================
  // 8. SESSION EXTRACTION & SECURITY CONTEXT
  // ==========================================
  describe("Session Context & Cookie Verification", () => {
    test("Session: Extracts businessId from jewellery_os_session cookie", () => {
      const sessionPayload = {
        id: "user-1",
        businessId: "tenant-sandhya-jaipur",
        role: "OWNER",
      };
      const req = new Request("http://localhost/api/products/search", {
        headers: {
          cookie: `jewellery_os_session=${encodeURIComponent(JSON.stringify(sessionPayload))}`,
        },
      });

      const session = extractSessionContext(req);
      assert.ok(session);
      assert.strictEqual(session.businessId, "tenant-sandhya-jaipur");
      assert.strictEqual(session.userId, "user-1");
    });

    test("Session: Extracts businessId from Authorization Bearer JSON token", () => {
      const token = JSON.stringify({
        businessId: "tenant-sandhya-jaipur",
        userId: "user-vikram",
      });
      const req = new Request("http://localhost/api/products/search", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const session = extractSessionContext(req);
      assert.ok(session);
      assert.strictEqual(session.businessId, "tenant-sandhya-jaipur");
    });

    test("Session: Extracts businessId from x-business-id header for internal gateway calls", () => {
      const req = new Request("http://localhost/api/products/search", {
        headers: {
          "x-business-id": "tenant-sandhya-jaipur",
        },
      });

      const session = extractSessionContext(req);
      assert.ok(session);
      assert.strictEqual(session.businessId, "tenant-sandhya-jaipur");
    });

    test("Session: Returns null when no session cookie or authorization header is present", () => {
      const req = new Request("http://localhost/api/products/search");
      const session = extractSessionContext(req);
      assert.strictEqual(session, null);
    });
  });
});
