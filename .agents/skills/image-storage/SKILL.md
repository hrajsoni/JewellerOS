---
name: image-storage
description: Private S3-compatible Neon object storage architecture, pre-signed upload/download URLs, and Sharp image processing.
---

# Image Storage & Media Management Skill

## 1. Storage Infrastructure Overview
- **Storage Provider:** Neon Object Storage (AWS S3-compatible endpoint in US-East-2).
- **Private Access Policy:** All buckets are private by default. Never expose public S3 write or read permissions.
- **Bucket Hierarchy:**
  - `jewelbill-product-media`: Product design renders, model photos, variant images.
  - `jewelbill-business-media`: Business logos, invoice signature stamps, showroom banners.
  - `jewelbill-platform-media`: Super admin assets and platform marketing assets.

---

## 2. Tenant Path Isolation Structure

```
jewelbill-product-media/
  └── business/
      └── {businessId}/
          ├── products/
          │   └── {productId}/
          │       ├── original/
          │       │   └── {imageId}.webp
          │       ├── thumbnails/
          │       │   ├── sm_150x150_{imageId}.webp
          │       │   └── md_400x400_{imageId}.webp
          │       └── gallery/
          │           └── ...
          ├── inventory/
          │   └── {stockItemId}/
          │       ├── actual-piece/
          │       │   └── {piecePhotoId}.webp
          │       └── hallmark-macro/
          │           └── {huidPhotoId}.webp
          └── documents/
              ├── purchase-invoices/
              └── girvi-pledge-photos/
```

---

## 3. Pre-Signed URL Lifecycle
1. **Upload Initiation (`POST /api/media/upload-intent`):**
   - Validates user authentication and `businessId`.
   - Validates mime-type (`image/jpeg`, `image/png`, `image/webp`).
   - Limits file size ($\le 10\text{MB}$).
   - Returns pre-signed S3 `PutObjectCommand` URL valid for **15 minutes**.
2. **Direct Browser-to-S3 Upload:**
   - Frontend uploads binary payload directly to Neon Object Storage via PUT.
3. **Upload Confirmation & Processing (`POST /api/media/confirm`):**
   - Server runs Sharp pipeline: EXIF stripping, WebP compression, multi-size thumbnail generation (150x150, 400x400, 1080x1080).
   - Records metadata in `media_assets` table.
4. **Secure Viewing (`GET /api/media/signed-url`):**
   - Generates pre-signed `GetObjectCommand` URL valid for **15 minutes**.
