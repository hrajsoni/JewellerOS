import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  parseFacetedSearchParams,
  buildFacetedSearchWhereClause,
  buildFacets,
  extractSessionContext,
} from "@/lib/search/facetedSearch";

export async function GET(request: Request) {
  try {
    // 1. Enforce strict tenant isolation: extract session context
    const session = extractSessionContext(request);
    if (!session || !session.businessId) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Missing authenticated session context. Client must provide a valid session cookie or token.",
        },
        { status: 401 }
      );
    }

    const { businessId } = session;

    // 2. Parse query parameters
    const params = parseFacetedSearchParams(request.url);

    // 3. Build Prisma where clause with strictly injected businessId
    const where = buildFacetedSearchWhereClause({
      businessId,
      params,
    });

    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    // 4. Concurrently query filtered items, total count, and facet pool for this tenant
    const [items, totalCount, allTenantStock] = await Promise.all([
      prisma.stockItem.findMany({
        where,
        include: {
          product: true,
          variant: true,
          movements: {
            orderBy: { timestamp: "desc" },
            take: 3,
          },
        },
        orderBy: { dateAcquired: "desc" },
        skip,
        take: limit,
      }),
      prisma.stockItem.count({ where }),
      prisma.stockItem.findMany({
        where: { businessId },
        select: {
          metal: true,
          purityKey: true,
          status: true,
          product: {
            select: {
              category: true,
            },
          },
        },
      }),
    ]);

    // 5. Build facets across the tenant stock inventory
    const facets = buildFacets(allTenantStock);

    return NextResponse.json({
      items,
      totalCount,
      facets,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to perform faceted product search.",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
