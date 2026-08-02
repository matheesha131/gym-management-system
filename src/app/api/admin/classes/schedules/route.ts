import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isAuthorizedForClassManagement, validateScheduleInput } from "@/lib/classes";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForClassManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [schedulesList] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id,
        s.class_id as classId,
        c.name as className,
        c.capacity as classCapacity,
        s.trainer_id as trainerId,
        u.name as trainerName,
        s.start_time as startTime,
        s.end_time as endTime,
        s.current_bookings as currentBookings
      FROM class_schedule s
      INNER JOIN gym_class c ON s.class_id = c.id
      LEFT JOIN user u ON s.trainer_id = u.id
      ORDER BY s.start_time DESC
    `);

    return NextResponse.json(schedulesList);
  } catch (error: any) {
    console.error("Error in GET /api/admin/classes/schedules:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch class schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForClassManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateScheduleInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const [existingClass] = await db.query<RowDataPacket[]>(
      `SELECT trainer_id as trainerId FROM gym_class WHERE id = ? LIMIT 1`,
      [validation.data.classId]
    );

    if (existingClass.length === 0) {
      return NextResponse.json({ error: "Gym class not found" }, { status: 404 });
    }

    const newScheduleId = crypto.randomUUID();
    const trainerId = validation.data.trainerId || existingClass[0].trainerId || null;

    await db.query(`
      INSERT INTO class_schedule (id, class_id, trainer_id, start_time, end_time, current_bookings)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      newScheduleId,
      validation.data.classId,
      trainerId,
      new Date(validation.data.startTime),
      new Date(validation.data.endTime),
      0
    ]);

    return NextResponse.json(
      {
        id: newScheduleId,
        classId: validation.data.classId,
        trainerId,
        startTime: validation.data.startTime,
        endTime: validation.data.endTime,
        currentBookings: 0,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/admin/classes/schedules:", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule class session" },
      { status: 500 }
    );
  }
}
