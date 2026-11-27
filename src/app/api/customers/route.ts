import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbCustomer } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const customers = await prisma.customer.findMany({
      where: { businessId: tenantId },
      include: { _count: { select: { invoices: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({
      success: true,
      customers: customers.map(mapDbCustomer),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      name,
      phone,
      email,
      city = "Jaipur",
      address,
      gstin,
      panNumber,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Customer name and phone are required." }, { status: 400 });
    }

    await ensureBusinessRecord(businessId);

    const customer = await prisma.customer.upsert({
      where: {
        businessId_phone: {
          businessId,
          phone: String(phone).trim(),
        },
      },
      update: {
        name,
        email: email || undefined,
        city,
        address: address || undefined,
        gstin: gstin || undefined,
        panNumber: panNumber || undefined,
      },
      create: {
        businessId,
        name,
        phone: String(phone).trim(),
        email: email || undefined,
        city,
        address: address || undefined,
        gstin: gstin || undefined,
        panNumber: panNumber || undefined,
      },
    });

    return NextResponse.json({ success: true, customer: mapDbCustomer(customer) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save customer.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      customerId,
      customerPhone,
      customerName,
      paymentAmount = 0,
      entryType = "collect_udhar",
      method = "Cash",
    } = body;

    const amt = Number(paymentAmount);
    if ((!customerId && !customerPhone) || !amt || amt <= 0) {
      return NextResponse.json(
        { error: "customerId or customerPhone and positive paymentAmount required." },
        { status: 400 }
      );
    }

    await ensureBusinessRecord(businessId);

    const updated = await prisma.$transaction(async (tx) => {
      let existing = customerId
        ? await tx.customer.findUnique({ where: { id: customerId } })
        : null;

      if (!existing && customerPhone) {
        existing = await tx.customer.findUnique({
          where: {
            businessId_phone: { businessId, phone: String(customerPhone).trim() },
          },
        });
      }

      if (!existing && customerPhone) {
        existing = await tx.customer.create({
          data: {
            businessId,
            name: customerName || "Showroom Customer",
            phone: String(customerPhone).trim(),
            city: "Jaipur",
            outstandingDue: new Prisma.Decimal(0),
          },
        });
      }

      if (!existing) {
        throw new Error("Customer record not found in database.");
      }

      const isCharge = entryType === "add_udhar";
      const cust = await tx.customer.update({
        where: { id: existing.id },
        data: {
          outstandingDue: isCharge
            ? { increment: new Prisma.Decimal(amt) }
            : { decrement: new Prisma.Decimal(amt) },
        },
      });

      const lower = String(method).toLowerCase();
      const acctCode = lower.includes("upi")
        ? "1030"
        : lower.includes("bank") || lower.includes("card")
        ? "1020"
        : "1010";

      if (isCharge) {
        await adjustAccountBalance(tx, businessId, "1050", amt);
      } else {
        await adjustAccountBalance(tx, businessId, acctCode, amt);
        if (entryType === "record_advance") {
          await adjustAccountBalance(tx, businessId, "2030", amt);
        } else {
          await adjustAccountBalance(tx, businessId, "1050", -amt);
        }
      }

      return cust;
    });

    return NextResponse.json({ success: true, customer: mapDbCustomer(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customer balance.", details: String(error) },
      { status: 500 }
    );
  }
}
