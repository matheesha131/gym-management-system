import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { gymClass, classSchedule, classBooking } from "@/db/schema/domain";
import { canBookClass } from "@/lib/classes";
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

    if (!body.scheduleId || typeof body.scheduleId !== "string" || !body.scheduleId.trim()) {
      return NextResponse.json({ error: "Schedule ID is required" }, { status: 400 });
    }

    const scheduleId = body.scheduleId.trim();
    const now = new Date();

    // Fetch schedule and class details
    const schedules = await db
      .select({
        id: classSchedule.id,
        capacity: gymClass.capacity,
        currentBookings: classSchedule.currentBookings,
        startTime: classSchedule.startTime,
      })
      .from(classSchedule)
      .innerJoin(gymClass, eq(classSchedule.classId, gymClass.id))
      .where(eq(classSchedule.id, scheduleId))
      .limit(1);

    if (schedules.length === 0) {
      return NextResponse.json({ error: "Class session schedule not found" }, { status: 404 });
    }

    const schedule = schedules[0];

    // Check existing booking for member
    const existingBookings = await db
      .select({
        id: classBooking.id,
        status: classBooking.status,
      })
      .from(classBooking)
      .where(
        and(
          eq(classBooking.scheduleId, scheduleId),
          eq(classBooking.memberId, userId)
        )
      )
      .orderBy(sql`${classBooking.createdAt} DESC`)
      .limit(1);

    const activeBooking = existingBookings.find(
      (b) => b.status === "confirmed" || b.status === "booked"
    );

    const evaluation = canBookClass(schedule, activeBooking, now);

    if (!evaluation.canBook) {
      return NextResponse.json({ error: evaluation.reason }, { status: 400 });
    }

    const newBookingId = crypto.randomUUID();

    // Execute transaction to book slot and increment current bookings count
    await db.transaction(async (tx) => {
      await tx.insert(classBooking).values({
        id: newBookingId,
        scheduleId: scheduleId,
        memberId: userId,
        status: "confirmed",
        createdAt: now,
      });

      await tx
        .update(classSchedule)
        .set({
          currentBookings: sql`${classSchedule.currentBookings} + 1`,
        })
        .where(eq(classSchedule.id, scheduleId));
    });

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
