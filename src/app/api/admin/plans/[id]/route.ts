import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { membershipPlan } from "@/db/schema/domain";
import { isAuthorizedForPlanMutation, validatePlanUpdate } from "@/lib/plans";
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

    const validation = validatePlanUpdate(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await db
      .update(membershipPlan)
      .set(validation.data)
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
