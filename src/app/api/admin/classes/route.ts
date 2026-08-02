import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isAuthorizedForClassManagement, validateClassInput } from "@/lib/classes";
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

    const [classesList] = await db.query<RowDataPacket[]>(`
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.trainer_id as trainerId, 
        u.name as trainerName, 
        c.capacity, 
        c.created_at as createdAt
      FROM gym_class c
      LEFT JOIN user u ON c.trainer_id = u.id
      ORDER BY c.created_at DESC
    `);

    const [trainersList] = await db.query<RowDataPacket[]>(`
      SELECT id, name, email, role
      FROM user
      ORDER BY name
    `);

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

    await db.query(`
      INSERT INTO gym_class (id, name, description, trainer_id, capacity, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      newClassId,
      validation.data.name,
      validation.data.description,
      validation.data.trainerId,
      validation.data.capacity,
      new Date()
    ]);

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
