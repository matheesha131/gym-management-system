import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscription, membershipPlan, checkIn } from "@/db/schema/domain";
import { isAuthorizedForMemberManagement } from "@/lib/members";
import { eq, desc } from "drizzle-orm";

export async function GET(
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

    if (!isAuthorizedForMemberManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        memberCode: user.memberCode,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const member = targetUser[0];

    // Fetch all subscriptions for this member
    const subscriptions = await db
      .select({
        id: subscription.id,
        planId: subscription.planId,
        planName: membershipPlan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        createdAt: subscription.createdAt,
      })
      .from(subscription)
      .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id))
      .where(eq(subscription.memberId, id))
      .orderBy(desc(subscription.createdAt));

    // Fetch recent check-ins for this member
    const checkIns = await db
      .select({
        id: checkIn.id,
        status: checkIn.status,
        scannedCode: checkIn.scannedCode,
        isOverride: checkIn.isOverride,
        overrideNotes: checkIn.overrideNotes,
        checkedInAt: checkIn.checkedInAt,
      })
      .from(checkIn)
      .where(eq(checkIn.memberId, id))
      .orderBy(desc(checkIn.checkedInAt))
      .limit(10);

    const now = new Date();
    const activeSub =
      subscriptions.find(
        (s) => s.status === "active" && new Date(s.endDate) > now
      ) || null;

    return NextResponse.json({
      ...member,
      activeSubscription: activeSub
        ? {
            id: activeSub.id,
            planName: activeSub.planName,
            startDate: activeSub.startDate,
            endDate: activeSub.endDate,
            status: activeSub.status,
          }
        : null,
      subscriptions,
      checkIns,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch member profile" },
      { status: 500 }
    );
  }
}
