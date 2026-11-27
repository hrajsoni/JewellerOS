import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mapDbSettings } from "@/lib/prismaMappers";
import { ensureBusinessRecord } from "@/lib/prismaBusinessHelper";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";

export async function GET(request: Request) {
  try {
    const tenantId = await resolveRequestBusinessId(request);

    const settings = await prisma.showroomMasterSettings.findUnique({
      where: { businessId: tenantId },
    });

    return NextResponse.json({
      success: true,
      settings: mapDbSettings(settings, tenantId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch showroom settings.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const resolvedTenantId = await resolveRequestBusinessId(request, body);
    const {
      tenantId = resolvedTenantId,
      businessName,
      tagline,
      address,
      city,
      stateCode = "08",
      phone,
      email,
      gstin,
      bisLicenseNumber,
    } = body;

    await ensureBusinessRecord(tenantId, businessName);

    const updated = await prisma.showroomMasterSettings.upsert({
      where: { businessId: tenantId },
      update: {
        showroomName: businessName || "Sandhya Jewellers",
        tagline: tagline || undefined,
        addressLine1: address || "142 Sarafa Bazar, M.I. Road",
        city: city || "Jaipur",
        stateCode: String(stateCode).slice(0, 5),
        contactPhones: phone ? [phone] : ["+91 94140 12345"],
        email: email || undefined,
        gstin: gstin || "08AAAAJ1234F1Z8",
        bisHallmarkLicense: bisLicenseNumber || undefined,
      },
      create: {
        businessId: tenantId,
        showroomName: businessName || "Sandhya Jewellers",
        tagline: tagline || undefined,
        addressLine1: address || "142 Sarafa Bazar, M.I. Road",
        city: city || "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        stateCode: String(stateCode).slice(0, 5),
        contactPhones: phone ? [phone] : ["+91 94140 12345"],
        email: email || undefined,
        gstin: gstin || "08AAAAJ1234F1Z8",
        bisHallmarkLicense: bisLicenseNumber || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      settings: mapDbSettings(updated, tenantId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist showroom settings.", details: String(error) },
      { status: 500 }
    );
  }
}
