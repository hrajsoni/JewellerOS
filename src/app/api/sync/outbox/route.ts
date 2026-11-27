import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureBusinessRecord } from '@/lib/prismaBusinessHelper';
import {
  processServerOutboxBatch,
  type ServerSyncMutationInput,
} from '@/lib/offline/serverSync';

/**
 * Next.js API Route handler for /api/sync/outbox.
 * Validates authentication session and businessId, then runs batch sync.
 */
export async function POST(request: Request) {
  try {
    // 1. Session & BusinessId Extraction
    let session: any = null;

    // Cookie session parsing
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMatch = cookieHeader.match(/jewellery_os_session=([^;]+)/);
    if (cookieMatch) {
      try {
        session = JSON.parse(decodeURIComponent(cookieMatch[1]));
      } catch {}
    }

    // Authorization Bearer token parsing (if sent as JSON or token)
    if (!session) {
      const authHeader = request.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        const tokenVal = authHeader.slice(7).trim();
        try {
          session = JSON.parse(tokenVal);
        } catch {
          // If bearer token is userId, look up user
          try {
            session = await prisma.user.findUnique({
              where: { id: tokenVal },
              include: { business: true },
            });
          } catch {}
        }
      }
    }

    // Header businessId fallback
    const headerBusinessId =
      request.headers.get('x-business-id') ||
      request.headers.get('x-tenant-id');

    // Parse request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const targetBusinessId =
      session?.businessId || headerBusinessId || body.businessId;

    if (!session && !headerBusinessId && !body.businessId) {
      return NextResponse.json(
        { error: 'Unauthorized: Active session and businessId are required.' },
        { status: 401 }
      );
    }

    if (targetBusinessId) {
      try {
        await ensureBusinessRecord(targetBusinessId);
      } catch {}
    }

    // Normalize mutations input
    let mutations: ServerSyncMutationInput[] = [];
    if (Array.isArray(body)) {
      mutations = body;
    } else if (Array.isArray(body.mutations)) {
      mutations = body.mutations;
    } else if (body.idempotencyKey) {
      mutations = [body];
    }

    if (mutations.length === 0) {
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        results: [],
      });
    }

    const { syncedCount, results } = await processServerOutboxBatch(mutations, {
      session,
      businessId: targetBusinessId,
      prismaClient: prisma,
    });

    return NextResponse.json({
      success: true,
      syncedCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Internal server error while processing sync outbox.',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
