import prisma from "@/lib/prisma";

export interface ResolvedUserSession {
  id?: string;
  businessId: string;
  role?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

/**
 * Extracts session object synchronously from cookie, authorization header, custom headers, or body.
 */
export function extractSessionFromRequest(request: Request, body?: any): ResolvedUserSession | null {
  // 1. Check cookies for jewellery_os_session
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/jewellery_os_session=([^;]+)/);
    if (match) {
      try {
        const decoded = decodeURIComponent(match[1]);
        const session = JSON.parse(decoded);
        if (session && (session.businessId || session.id)) {
          return {
            id: session.id,
            businessId: session.businessId,
            role: session.role,
            fullName: session.fullName,
            email: session.email,
            phone: session.phone,
          };
        }
      } catch {}
    }
  }

  // 2. Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    try {
      const parsed = JSON.parse(token);
      if (parsed && (parsed.businessId || parsed.id)) {
        return {
          id: parsed.id,
          businessId: parsed.businessId,
          role: parsed.role,
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
        };
      }
    } catch {
      if (token.startsWith("tenant-") || token.startsWith("biz_") || token.length > 5) {
        return { businessId: token };
      }
    }
  }

  // 3. Check custom headers
  const headerTenant = request.headers.get("x-business-id") || request.headers.get("x-tenant-id");
  if (headerTenant) {
    return {
      id: request.headers.get("x-user-id") || undefined,
      businessId: headerTenant,
      role: request.headers.get("x-user-role") || undefined,
    };
  }

  // 4. Check body if provided
  if (body) {
    if (body.session && body.session.businessId) {
      return {
        id: body.session.id,
        businessId: body.session.businessId,
        role: body.session.role,
        fullName: body.session.fullName,
        email: body.session.email,
        phone: body.session.phone,
      };
    }
    if (body.businessId && (body.authenticated === true || body.userId)) {
      return {
        id: body.userId,
        businessId: body.businessId,
        role: body.role,
        fullName: body.fullName,
      };
    }
  }

  return null;
}

/**
 * Resolves the target businessId for any incoming API request:
 * 1. Checks query parameters (tenantId / businessId)
 * 2. Checks body properties (businessId / tenantId)
 * 3. Checks active session (cookie / header)
 * 4. Falls back to the primary Business row in PostgreSQL
 * 5. If no businesses exist in DB, creates the initial showroom dynamically.
 */
export async function resolveRequestBusinessId(
  request: Request,
  body?: any,
  explicitFallback?: string
): Promise<string> {
  // Query param check
  try {
    const url = new URL(request.url);
    const qTenant = url.searchParams.get("tenantId") || url.searchParams.get("businessId");
    if (qTenant && qTenant.trim()) {
      return qTenant.trim();
    }
  } catch {}

  // Body check
  if (body) {
    const bTenant = body.businessId || body.tenantId;
    if (typeof bTenant === "string" && bTenant.trim()) {
      return bTenant.trim();
    }
  }

  // Session check
  const session = extractSessionFromRequest(request, body);
  if (session?.businessId && session.businessId.trim()) {
    return session.businessId.trim();
  }

  if (explicitFallback && explicitFallback.trim()) {
    return explicitFallback.trim();
  }

  // Fallback to first business in PostgreSQL
  try {
    const primary = await prisma.business.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (primary?.id) {
      return primary.id;
    }

    // If completely empty database, provision initial showroom
    const initial = await prisma.business.create({
      data: {
        id: "tenant-sandhya-jaipur",
        name: "Sandhya Jewellers",
        legalEntityName: "Sandhya Jewellers Pvt Ltd",
        phone: "+91 94140 12345",
        email: "sandhya.jewellers.jpr@gmail.com",
        address: "142 Sarafa Bazar, M.I. Road",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        currency: "INR",
      },
    });
    return initial.id;
  } catch {
    return "tenant-sandhya-jaipur";
  }
}
