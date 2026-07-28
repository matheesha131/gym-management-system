import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { classSchedule, classBooking } from "@/db/schema/domain";
import { canCancelBooking } from "@/lib/classes";
import { eq, and, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));

    if (!body.bookingId || typeof body.bookingId !== "string" || !body.bookingId.trim()) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const bookingId = body.bookingId.trim();
    const now = new Date();

    // Fetch booking
    const bookings = await db
      .select({
        id: classBooking.id,
        scheduleId: classBooking.scheduleId,
        memberId: classBooking.memberId,
        status: classBooking.status,
      })
      .from(classBooking)
      .where(eq(classBooking.id, bookingId))
      .limit(1);

    if (bookings.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookings[0];

    // Check authorization: member can only cancel their own booking, staff/admin can cancel any
    const isStaffOrAdmin = session.user.role === "admin" || session.user.role === "staff";
    if (booking.memberId !== userId && !isStaffOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch schedule
    const schedules = await db
      .select({
        id: classSchedule.id,
        capacity: classSchedule.currentBookings,
        currentBookings: classSchedule.currentBookings,
        startTime: classSchedule.startTime,
      })
      .from(classSchedule)
      .where(eq(classSchedule.id, booking.scheduleId))
      .limit(1);

    if (schedules.length === 0) {
      return NextResponse.json({ error: "Class schedule not found" }, { status: 404 });
    }

    const evaluation = canCancelBooking(booking, schedules[0], now);
    if (!evaluation.canCancel) {
      return NextResponse.json({ error: evaluation.reason }, { status: 400 });
    }

    // Transaction to set status to cancelled and decrement currentBookings
    await db.transaction(async (tx) => {
      await tx
        .update(classBooking)
        .set({
          status: "cancelled",
        })
        .where(eq(classBooking.id, bookingId));

      await tx
        .update(classSchedule)
        .set({
          currentBookings: sql`GREATEST(0, ${classSchedule.currentBookings} - 1)`,
        })
        .where(eq(classSchedule.id, booking.scheduleId));
    });

    return NextResponse.json({
      id: bookingId,
      scheduleId: booking.scheduleId,
      status: "cancelled",
    });
  } catch (error: any) {
    console.error("Error in POST /api/portal/classes/bookings/cancel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
