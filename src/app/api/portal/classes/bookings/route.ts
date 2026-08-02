import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { canBookClass } from "@/lib/classes";
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

    if (!body.scheduleId || typeof body.scheduleId !== "string" || !body.scheduleId.trim()) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    const scheduleId = body.scheduleId.trim();
    const now = new Date();

    const [schedules] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, c.capacity, s.current_bookings as currentBookings, s.start_time as startTime
      FROM class_schedule s
      INNER JOIN gym_class c ON s.class_id = c.id
      WHERE s.id = ? LIMIT 1
    `, [scheduleId]);

    if (schedules.length === 0) {
      return NextResponse.json({ error: "Class session schedule not found" }, { status: 404 });
    }

    const schedule = schedules[0];

    const [existingBookings] = await db.query<RowDataPacket[]>(`
      SELECT id, status
      FROM class_booking
      WHERE schedule_id = ? AND member_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [scheduleId, userId]);

    const activeBooking = existingBookings.find(
      (b) => b.status === "confirmed" || b.status === "booked"
    );

    const evaluation = canBookClass(schedule as any, activeBooking as any, now);

    if (!evaluation.canBook) {
      return NextResponse.json({ error: evaluation.reason }, { status: 400 });
    }

    const newBookingId = crypto.randomUUID();
    let updateSuccess = false;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [updateResult] = await connection.query<any>(`
        UPDATE class_schedule 
        SET current_bookings = current_bookings + 1 
        WHERE id = ? AND current_bookings < ?
      `, [scheduleId, schedule.capacity]);

      if (updateResult.affectedRows > 0) {
        await connection.query(`
          INSERT INTO class_booking (id, schedule_id, member_id, status, created_at)
          VALUES (?, ?, ?, 'confirmed', ?)
        `, [newBookingId, scheduleId, userId, now]);
        updateSuccess = true;
      }

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

    if (!updateSuccess) {
      return NextResponse.json({ error: "Class session is fully booked" }, { status: 400 });
    }

    return NextResponse.json(
      {
        id: newBookingId,
        scheduleId,
        memberId: userId,
        status: "confirmed",
        createdAt: now.toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/portal/classes/bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to book class session" },
      { status: 500 }
    );
  }
}
