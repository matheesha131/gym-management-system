import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { validatePlanInput, isAuthorizedForPlanMutation } from "@/lib/plans";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForPlanMutation(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [plans] = await db.query<RowDataPacket[]>(`
      SELECT id, name, description, duration_days as durationDays, price, is_active as isActive, created_at as createdAt, updated_at as updatedAt
      FROM membership_plan
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch membership plans" },
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

    if (!isAuthorizedForPlanMutation(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = validatePlanInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const newPlan = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      description: validation.data.description ?? null,
      durationDays: validation.data.durationDays,
      price: validation.data.price,
      isActive: validation.data.isActive,
    };

    await db.query(`
      INSERT INTO membership_plan (id, name, description, duration_days, price, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      newPlan.id,
      newPlan.name,
      newPlan.description,
      newPlan.durationDays,
      newPlan.price,
      newPlan.isActive
    ]);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create membership plan" },
      { status: 500 }
    );
  }
}
