import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { membershipPlan } from "@/db/schema/domain";
import { isAuthorizedForPlanMutation } from "@/lib/plans";
import { eq } from "drizzle-orm";

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

    const existing = await db
      .select()
      .from(membershipPlan)
      .where(eq(membershipPlan.id, id));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }

    if (body.durationDays !== undefined) {
      const durationDays = Number(body.durationDays);
      if (isNaN(durationDays) || !Number.isInteger(durationDays) || durationDays <= 0) {
        return NextResponse.json(
          { error: "Duration (days) must be a positive integer" },
          { status: 400 }
        );
      }
      updateData.durationDays = durationDays;
    }

    if (body.price !== undefined) {
      const priceNum = Number(body.price);
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json(
          { error: "Price must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.price = priceNum.toFixed(2);
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    await db
      .update(membershipPlan)
      .set(updateData)
      .where(eq(membershipPlan.id, id));

    const updated = await db
      .select()
      .from(membershipPlan)
      .where(eq(membershipPlan.id, id));

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update membership plan" },
      { status: 500 }
    );
  }
}
