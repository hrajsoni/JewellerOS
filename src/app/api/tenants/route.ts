import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mapDbBusinessToTenant } from "@/lib/prismaMappers";
import { seedDefaultAccountsForBusiness } from "@/lib/prismaBusinessHelper";

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      success: true,
      tenants: businesses.map((b) => mapDbBusinessToTenant(b)),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tenant showrooms.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      businessName,
      ownerName,
      phone,
      email,
      city = "Jaipur",
      address = "Sarafa Bazar",
      gstin,
      bisLicense,
      defaultGoldRate = 150000,
      defaultSilverRate = 95000,
    } = body;

    if (!businessName) {
      return NextResponse.json({ error: "businessName is required." }, { status: 400 });
    }

    const tenantId =
      id || `tenant-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const created = await prisma.$transaction(async (tx) => {
      const b = await tx.business.upsert({
        where: { id: tenantId },
        update: {
          name: businessName,
          legalEntityName: ownerName || businessName,
          phone: phone || "+91 94140 12345",
          email: email || undefined,
          city,
          address,
          gstin: gstin || undefined,
          bisLicense: bisLicense || undefined,
        },
        create: {
          id: tenantId,
          name: businessName,
          legalEntityName: ownerName || businessName,
          phone: phone || "+91 94140 12345",
          email: email || undefined,
          city,
          state: "Rajasthan",
          pincode: "302001",
          address,
          gstin: gstin || undefined,
          bisLicense: bisLicense || undefined,
        },
      });

      await seedDefaultAccountsForBusiness(tx, b.id);

      await tx.metalRate.createMany({
        data: [
          {
            businessId: b.id,
            metal: "GOLD",
            purityKey: "24K",
            purityPercent: 1.0,
            sellingRate: defaultGoldRate,
            purchaseRate: Math.round(defaultGoldRate * 0.985),
            source: "TENANT_INIT",
          },
          {
            businessId: b.id,
            metal: "SILVER",
            purityKey: "999",
            purityPercent: 0.999,
            sellingRate: defaultSilverRate,
            purchaseRate: Math.round(defaultSilverRate * 0.97),
            source: "TENANT_INIT",
          },
        ],
      });

      return b;
    });

    return NextResponse.json(
      { success: true, tenant: mapDbBusinessToTenant(created, defaultGoldRate, defaultSilverRate) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create tenant business.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, businessName, ownerName, phone, email, city, address, gstin, bisLicense } = body;
    if (!id) {
      return NextResponse.json({ error: "Tenant id is required." }, { status: 400 });
    }
    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(businessName ? { name: businessName } : {}),
        ...(ownerName ? { legalEntityName: ownerName } : {}),
        ...(phone ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(city ? { city } : {}),
        ...(address ? { address } : {}),
        ...(gstin !== undefined ? { gstin } : {}),
        ...(bisLicense !== undefined ? { bisLicense } : {}),
      },
    });
    return NextResponse.json({ success: true, tenant: mapDbBusinessToTenant(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update tenant profile.", details: String(error) },
      { status: 500 }
    );
  }
}
