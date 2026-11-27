import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbRepair, mapDbBooking } from "@/lib/prismaMappers";
import { ensureBusinessRecord } from "@/lib/prismaBusinessHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const [repairs, bookings] = await Promise.all([
      prisma.repairJob.findMany({ where: { businessId: tenantId }, orderBy: { intakeDate: "desc" } }),
      prisma.customBookingOrder.findMany({
        where: { businessId: tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      repairs: repairs.map(mapDbRepair),
      bookings: bookings.map(mapDbBooking),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch repairs & bookings.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, businessId = "tenant-sandhya-jaipur", payload = {} } = body;
    await ensureBusinessRecord(businessId);

    if (action === "create_booking") {
      const orderNum =
        payload.bookingNumber || `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await prisma.customBookingOrder.create({
        data: {
          businessId,
          orderNumber: orderNum,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone || "",
          ornamentType: payload.title || payload.category || "Custom Ornament",
          targetGrossWeight: new Prisma.Decimal(payload.targetWeightGrams || 0),
          purity: payload.purity || "22K (916)",
          lockedGoldRatePer10g: payload.fixedGoldRate
            ? new Prisma.Decimal(payload.fixedGoldRate)
            : null,
          advanceAmountPaid: new Prisma.Decimal(payload.advanceReceivedAmount || 0),
          estimatedTotalAmount: new Prisma.Decimal(payload.estimatedTotal || 0),
          deliveryPromiseDate: new Date(payload.dueDate || Date.now() + 14 * 86400000),
          status: "booked",
        },
      });
      return NextResponse.json({ success: true, booking: mapDbBooking(created) }, { status: 201 });
    }

    const repairNumber =
      payload.repairNumber || `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await prisma.repairJob.create({
      data: {
        businessId,
        repairNumber,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone || "",
        ornamentName: payload.ornamentDescription || "Jewellery Repair",
        intakeGrossWeight: new Prisma.Decimal(payload.intakeGrossWeight || 0),
        problemDescription: payload.conditionNotes || "",
        estimatedCost: new Prisma.Decimal(payload.estimatedCharges || 0),
        deliveryPromiseDate: new Date(payload.expectedDeliveryDate || Date.now() + 3 * 86400000),
        status: "received",
      },
    });
    return NextResponse.json({ success: true, repair: mapDbRepair(created) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save repair/booking record.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, id, status, finalCharges } = body;

    if (action === "update_booking") {
      const updated = await prisma.customBookingOrder.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ success: true, booking: mapDbBooking(updated) });
    }

    const updated = await prisma.repairJob.update({
      where: { id },
      data: {
        status,
        ...(finalCharges !== undefined ? { estimatedCost: new Prisma.Decimal(finalCharges) } : {}),
        ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ success: true, repair: mapDbRepair(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update repair/booking status.", details: String(error) },
      { status: 500 }
    );
  }
}
