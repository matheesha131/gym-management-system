import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { gymClass, classSchedule } from "@/db/schema/domain";
import { isAuthorizedForClassManagement, validateScheduleInput } from "@/lib/classes";
import { eq, desc, gte } from "drizzle-orm";

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

    const schedulesList = await db
      .select({
        id: classSchedule.id,
        classId: classSchedule.classId,
        className: gymClass.name,
        classCapacity: gymClass.capacity,
        trainerId: classSchedule.trainerId,
        trainerName: user.name,
        startTime: classSchedule.startTime,
        endTime: classSchedule.endTime,
        currentBookings: classSchedule.currentBookings,
      })
      .from(classSchedule)
      .innerJoin(gymClass, eq(classSchedule.classId, gymClass.id))
      .leftJoin(user, eq(classSchedule.trainerId, user.id))
      .orderBy(desc(classSchedule.startTime));

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

    // Verify gym class exists
    const existingClass = await db
      .select()
      .from(gymClass)
      .where(eq(gymClass.id, validation.data.classId))
      .limit(1);

    if (existingClass.length === 0) {
      return NextResponse.json({ error: "Gym class not found" }, { status: 404 });
    }

    const newScheduleId = crypto.randomUUID();

    await db.insert(classSchedule).values({
      id: newScheduleId,
      classId: validation.data.classId,
      trainerId: validation.data.trainerId || existingClass[0].trainerId || null,
      startTime: new Date(validation.data.startTime),
      endTime: new Date(validation.data.endTime),
      currentBookings: 0,
    });

    return NextResponse.json(
      {
        id: newScheduleId,
        classId: validation.data.classId,
        trainerId: validation.data.trainerId,
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
