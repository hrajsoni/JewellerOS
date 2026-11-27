import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { ensureBusinessRecord } from "@/lib/prismaBusinessHelper";
import { extractSessionFromRequest } from "@/lib/media/authHelper";
import { getPresignedDownloadUrl } from "@/lib/media/s3Client";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    // 1. Authenticate session
    const session = extractSessionFromRequest(request, body);
    if (!session || !session.businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session is required." },
        { status: 401 }
      );
    }

    const {
      assetId,
      storageKey,
      fileName,
      mimeType,
      fileSize,
      productId,
      stockItemId,
      mediaType = "DESIGN_RENDER",
      width,
      height,
      thumbnails,
      caption,
      isPrimary = false,
      sortOrder = 0,
    } = body;

    // 2. Validate required fields
    if (!storageKey || !fileName || !mimeType || fileSize === undefined || fileSize === null) {
      return NextResponse.json(
        { error: "storageKey, fileName, mimeType, and fileSize are required." },
        { status: 400 }
      );
    }

    // Verify storage key belongs to this business (strict tenant isolation check)
    if (!storageKey.startsWith(`business/${session.businessId}/`)) {
      return NextResponse.json(
        { error: "Forbidden: Storage key does not belong to your business partition." },
        { status: 403 }
      );
    }

    // Ensure business record exists in database
    await ensureBusinessRecord(session.businessId);

    // Validate mediaType enum
    const validMediaTypes: MediaType[] = [
      "DESIGN_RENDER",
      "PIECE_PHOTO",
      "HALLMARK_MACRO",
      "CERTIFICATE",
      "GENERAL_DOCUMENT",
    ];
    const resolvedMediaType: MediaType = validMediaTypes.includes(mediaType as MediaType)
      ? (mediaType as MediaType)
      : "DESIGN_RENDER";

    // If isPrimary is true, unset primary status on existing media assets for this product/stock item
    if (isPrimary && (productId || stockItemId)) {
      await prisma.mediaAsset.updateMany({
        where: {
          businessId: session.businessId,
          ...(productId ? { productId } : {}),
          ...(stockItemId ? { stockItemId } : {}),
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // 3. Create MediaAsset in database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        ...(assetId ? { id: assetId } : {}),
        businessId: session.businessId,
        productId: productId || null,
        stockItemId: stockItemId || null,
        mediaType: resolvedMediaType,
        storageKey,
        fileName,
        mimeType,
        fileSize: Math.round(Number(fileSize)),
        width: width ? Math.round(Number(width)) : null,
        height: height ? Math.round(Number(height)) : null,
        thumbnails: thumbnails ?? null,
        caption: caption || null,
        isPrimary: Boolean(isPrimary),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      mediaAsset,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to confirm media asset upload.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = extractSessionFromRequest(request);
    const businessId =
      session?.businessId ||
      searchParams.get("businessId") ||
      searchParams.get("tenantId") ||
      "tenant-sandhya-jaipur";
    const productId = searchParams.get("productId");
    const stockItemId = searchParams.get("stockItemId");
    const mediaType = searchParams.get("mediaType");

    const where: any = { businessId };
    if (productId) where.productId = productId;
    if (stockItemId) where.stockItemId = stockItemId;
    if (mediaType) where.mediaType = mediaType;

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        try {
          const downloadUrl = await getPresignedDownloadUrl(asset.storageKey);
          return { ...asset, downloadUrl };
        } catch {
          return asset;
        }
      })
    );

    return NextResponse.json({
      success: true,
      count: assetsWithUrls.length,
      assets: assetsWithUrls,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch media assets.", details: String(error) },
      { status: 500 }
    );
  }
}
