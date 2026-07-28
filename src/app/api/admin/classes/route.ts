import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { gymClass } from "@/db/schema/domain";
import { isAuthorizedForClassManagement, validateClassInput } from "@/lib/classes";
import { eq, desc } from "drizzle-orm";

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

    const classesList = await db
      .select({
        id: gymClass.id,
        name: gymClass.name,
        description: gymClass.description,
        trainerId: gymClass.trainerId,
        trainerName: user.name,
        capacity: gymClass.capacity,
        createdAt: gymClass.createdAt,
      })
      .from(gymClass)
      .leftJoin(user, eq(gymClass.trainerId, user.id))
      .orderBy(desc(gymClass.createdAt));

    const trainersList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      .from(user)
      .orderBy(user.name);

    return NextResponse.json({
      classes: classesList,
      trainers: trainersList,
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/classes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch gym classes" },
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
    const validation = validateClassInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const newClassId = crypto.randomUUID();

    await db.insert(gymClass).values({
      id: newClassId,
      name: validation.data.name,
      description: validation.data.description,
      trainerId: validation.data.trainerId,
      capacity: validation.data.capacity,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        id: newClassId,
        name: validation.data.name,
        description: validation.data.description,
        trainerId: validation.data.trainerId,
        capacity: validation.data.capacity,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/admin/classes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create gym class" },
      { status: 500 }
    );
  }
}
