import crypto from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface PlatformAdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.DATABASE_URL?.slice(-32) ||
  "jewelbill_platform_super_admin_sec_2026_x!";

export function signAdminToken(payload: Omit<PlatformAdminSession, "iat" | "exp">): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; // 24 hours
  const fullPayload: PlatformAdminSession = { ...payload, iat, exp };

  const encodedData = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(encodedData)
    .digest("base64url");

  return `${encodedData}.${signature}`;
}

export function verifyAdminToken(token: string): PlatformAdminSession | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedData, signature] = token.split(".");
  if (!encodedData || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(encodedData)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload: PlatformAdminSession = JSON.parse(
      Buffer.from(encodedData, "base64url").toString("utf8")
    );
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function extractAdminSession(request: Request): PlatformAdminSession | null {
  // 1. From cookie jewelbill_admin_session
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/jewelbill_admin_session=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      const session = verifyAdminToken(token);
      if (session) return session;
    }
  }

  // 2. From Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    const session = verifyAdminToken(token);
    if (session) return session;
  }

  return null;
}

export async function requireAdminSession(
  request: Request
): Promise<{ session: PlatformAdminSession } | { error: NextResponse }> {
  const session = extractAdminSession(request);

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized. Super Admin authentication required." },
        { status: 401 }
      ),
    };
  }

  // Validate admin is still active in database
  const admin = await prisma.platformAdmin.findUnique({
    where: { id: session.id },
    select: { id: true, isActive: true, role: true },
  });

  if (!admin || !admin.isActive) {
    return {
      error: NextResponse.json(
        { error: "Super Admin account is deactivated or deleted." },
        { status: 403 }
      ),
    };
  }

  return { session };
}
