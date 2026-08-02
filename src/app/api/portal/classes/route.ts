import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    const [schedulesList] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, s.class_id as classId, c.name as className, c.description as classDescription, 
        c.capacity, s.trainer_id as trainerId, u.name as trainerName, 
        s.start_time as startTime, s.end_time as endTime, s.current_bookings as currentBookings
      FROM class_schedule s
      INNER JOIN gym_class c ON s.class_id = c.id
      LEFT JOIN user u ON s.trainer_id = u.id
      WHERE s.end_time >= ?
      ORDER BY s.start_time ASC
    `, [new Date(now.getTime() - 24 * 60 * 60 * 1000)]);

    const [userBookings] = await db.query<RowDataPacket[]>(`
      SELECT id, schedule_id as scheduleId, status, created_at as createdAt
      FROM class_booking
      WHERE member_id = ?
    `, [userId]);

    const userBookingsMap = new Map(
      userBookings
        .filter((b) => b.status === "confirmed" || b.status === "booked")
        .map((b) => [b.scheduleId, b.id])
    );

    const formattedSchedules = schedulesList.map((s) => {
      const availableSlots = Math.max(0, s.capacity - s.currentBookings);
      const isBooked = userBookingsMap.has(s.id);
      const userBookingId = userBookingsMap.get(s.id) || null;

      return {
        ...s,
        availableSlots,
        isBooked,
        userBookingId,
      };
    });

    const [myBookingsList] = await db.query<RowDataPacket[]>(`
      SELECT 
        b.id, b.schedule_id as scheduleId, b.status, b.created_at as createdAt, 
        c.name as className, s.start_time as startTime, s.end_time as endTime, 
        u.name as trainerName
      FROM class_booking b
      INNER JOIN class_schedule s ON b.schedule_id = s.id
      INNER JOIN gym_class c ON s.class_id = c.id
      LEFT JOIN user u ON s.trainer_id = u.id
      WHERE b.member_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);

    return NextResponse.json({
      schedules: formattedSchedules,
      myBookings: myBookingsList,
    });
  } catch (error: any) {
    console.error("Error in GET /api/portal/classes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch portal classes" },
      { status: 500 }
    );
  }
}
