export interface MediaSession {
  id?: string;
  businessId: string;
  role?: string;
  fullName?: string;
}

/**
 * Resolves authenticated user session from Next.js request cookies, Authorization header,
 * custom headers, or fallback test bodies.
 */
export function extractSessionFromRequest(request: Request, body?: any): MediaSession | null {
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
            businessId: session.businessId || "tenant-sandhya-jaipur",
            role: session.role,
            fullName: session.fullName,
          };
        }
      } catch {}
    }
  }

  // 2. Check Authorization header (Bearer token or JSON)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    try {
      const parsed = JSON.parse(token);
      if (parsed && (parsed.businessId || parsed.id)) {
        return {
          id: parsed.id,
          businessId: parsed.businessId || "tenant-sandhya-jaipur",
          role: parsed.role,
          fullName: parsed.fullName,
        };
      }
    } catch {
      if (token.startsWith("tenant-") || token.length > 5) {
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
    };
  }

  // 4. Check body if provided (e.g. for testing / direct internal calls)
  if (body) {
    if (body.session && body.session.businessId) {
      return {
        id: body.session.id,
        businessId: body.session.businessId,
        role: body.session.role,
        fullName: body.session.fullName,
      };
    }
    if (body.businessId && body.authenticated === true) {
      return {
        id: body.userId,
        businessId: body.businessId,
        role: body.role,
      };
    }
  }

  return null;
}
