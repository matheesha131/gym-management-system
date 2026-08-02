import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isAuthorizedForPlanMutation, validatePlanUpdate } from "@/lib/plans";
import { RowDataPacket } from "mysql2";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const [existing] = await db.query<RowDataPacket[]>(
      `SELECT id FROM membership_plan WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const validation = validatePlanUpdate(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updateFields = [];
    const updateValues = [];
    
    if (validation.data.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(validation.data.name);
    }
    if (validation.data.description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(validation.data.description);
    }
    if (validation.data.durationDays !== undefined) {
      updateFields.push("duration_days = ?");
      updateValues.push(validation.data.durationDays);
    }
    if (validation.data.price !== undefined) {
      updateFields.push("price = ?");
      updateValues.push(validation.data.price);
    }
    if (validation.data.isActive !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(validation.data.isActive);
    }

    if (updateFields.length > 0) {
      updateValues.push(new Date());
      updateFields.push("updated_at = ?");
      
      updateValues.push(id);
      await db.query(`UPDATE membership_plan SET ${updateFields.join(", ")} WHERE id = ?`, updateValues);
    }

    const [updated] = await db.query<RowDataPacket[]>(
      `SELECT id, name, description, duration_days as durationDays, price, is_active as isActive, created_at as createdAt, updated_at as updatedAt FROM membership_plan WHERE id = ? LIMIT 1`,
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update membership plan" },
      { status: 500 }
    );
  }
}
