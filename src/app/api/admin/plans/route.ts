import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { membershipPlan } from "@/db/schema/domain";
import { validatePlanInput, isAuthorizedForPlanMutation } from "@/lib/plans";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const plans = await db
      .select()
      .from(membershipPlan)
      .orderBy(desc(membershipPlan.createdAt));
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

    await db.insert(membershipPlan).values(newPlan);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create membership plan" },
      { status: 500 }
    );
  }
}
