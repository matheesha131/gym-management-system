import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { gymClass, classSchedule, classBooking } from "@/db/schema/domain";
import { eq, and, desc, gte, inArray } from "drizzle-orm";

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

    // Fetch upcoming and recent class schedules
    const schedulesList = await db
      .select({
        id: classSchedule.id,
        classId: classSchedule.classId,
        className: gymClass.name,
        classDescription: gymClass.description,
        capacity: gymClass.capacity,
        trainerId: classSchedule.trainerId,
        trainerName: user.name,
        startTime: classSchedule.startTime,
        endTime: classSchedule.endTime,
        currentBookings: classSchedule.currentBookings,
      })
      .from(classSchedule)
      .innerJoin(gymClass, eq(classSchedule.classId, gymClass.id))
      .leftJoin(user, eq(classSchedule.trainerId, user.id))
      .where(gte(classSchedule.endTime, new Date(now.getTime() - 24 * 60 * 60 * 1000))) // show active & recent
      .orderBy(classSchedule.startTime);

    // Fetch member's bookings
    const userBookings = await db
      .select({
        id: classBooking.id,
        scheduleId: classBooking.scheduleId,
        status: classBooking.status,
        createdAt: classBooking.createdAt,
      })
      .from(classBooking)
      .where(eq(classBooking.memberId, userId));

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

    // Detailed user bookings list with schedule details
    const myBookingsList = await db
      .select({
        id: classBooking.id,
        scheduleId: classBooking.scheduleId,
        status: classBooking.status,
        createdAt: classBooking.createdAt,
        className: gymClass.name,
        startTime: classSchedule.startTime,
        endTime: classSchedule.endTime,
        trainerName: user.name,
      })
      .from(classBooking)
      .innerJoin(classSchedule, eq(classBooking.scheduleId, classSchedule.id))
      .innerJoin(gymClass, eq(classSchedule.classId, gymClass.id))
      .leftJoin(user, eq(classSchedule.trainerId, user.id))
      .where(eq(classBooking.memberId, userId))
      .orderBy(desc(classBooking.createdAt));

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
