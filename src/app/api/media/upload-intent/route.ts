import { NextResponse } from "next/server";
import { buildMediaStorageKey, getPresignedUploadUrl } from "@/lib/media/s3Client";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/media/imageProcessor";
import { extractSessionFromRequest } from "@/lib/media/authHelper";
import crypto from "crypto";

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

    // 1. Validate authenticated session
    const session = extractSessionFromRequest(request, body);
    if (!session || !session.businessId) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session is required." },
        { status: 401 }
      );
    }

    const {
      fileName,
      fileSize,
      mimeType,
      contentType,
      category = "products",
      entityId,
      productId,
      stockItemId,
      variant = "original",
    } = body;

    // 2. Validate file size
    if (fileSize === undefined || fileSize === null || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "File size (in bytes) is required." },
        { status: 400 }
      );
    }

    if (fileSize <= 0) {
      return NextResponse.json(
        { error: "File size must be greater than 0 bytes." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size exceeds the 10MB maximum limit. Specified: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // 3. Validate MIME type
    const resolvedMime = (mimeType || contentType || "").trim().toLowerCase();
    if (!resolvedMime) {
      return NextResponse.json(
        { error: "MIME type (mimeType or contentType) is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(resolvedMime as any)) {
      return NextResponse.json(
        {
          error: `Invalid MIME type '${resolvedMime}'. Allowed types are: ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Generate assetId and storageKey
    const assetId = body.assetId || `asset_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const resolvedEntityId = entityId || productId || stockItemId || assetId;
    const cleanFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
      : `${assetId}.${resolvedMime === "image/jpeg" ? "jpg" : resolvedMime === "image/png" ? "png" : "webp"}`;

    const validCategories = ["products", "inventory", "documents", "branding"] as const;
    const resolvedCategory = validCategories.includes(category) ? category : "products";
    const validVariants = ["original", "thumbnails", "macro", "documents"] as const;
    const resolvedVariant = validVariants.includes(variant) ? variant : "original";

    const storageKey = buildMediaStorageKey({
      businessId: session.businessId,
      category: resolvedCategory,
      entityId: resolvedEntityId,
      variant: resolvedVariant,
      fileName: cleanFileName,
    });

    // 5. Generate pre-signed S3 PUT URL with 15-minute TTL (900 seconds)
    const uploadUrl = await getPresignedUploadUrl({
      storageKey,
      contentType: resolvedMime,
      maxSizeBytes: fileSize,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      storageKey,
      assetId,
      expiresIn: 900,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate media upload intent.", details: String(error) },
      { status: 500 }
    );
  }
}
