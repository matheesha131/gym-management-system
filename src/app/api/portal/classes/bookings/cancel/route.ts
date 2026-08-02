import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { canCancelBooking } from "@/lib/classes";
import { RowDataPacket } from "mysql2";

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

    const [bookings] = await db.query<RowDataPacket[]>(`
      SELECT id, schedule_id as scheduleId, member_id as memberId, status
      FROM class_booking
      WHERE id = ? LIMIT 1
    `, [bookingId]);

    if (bookings.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookings[0];

    const isStaffOrAdmin = session.user.role === "admin" || session.user.role === "staff";
    if (booking.memberId !== userId && !isStaffOrAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [schedules] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, c.capacity, s.current_bookings as currentBookings, s.start_time as startTime
      FROM class_schedule s
      INNER JOIN gym_class c ON s.class_id = c.id
      WHERE s.id = ? LIMIT 1
    `, [booking.scheduleId]);

    if (schedules.length === 0) {
      return NextResponse.json({ error: "Class schedule not found" }, { status: 404 });
    }

    const evaluation = canCancelBooking(booking, schedules[0] as any, now);
    if (!evaluation.canCancel) {
      return NextResponse.json({ error: evaluation.reason }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE class_booking SET status = 'cancelled' WHERE id = ?`,
        [bookingId]
      );

      await connection.query(
        `UPDATE class_schedule SET current_bookings = GREATEST(0, current_bookings - 1) WHERE id = ?`,
        [booking.scheduleId]
      );

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

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
