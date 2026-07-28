import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscription, membershipPlan, checkIn } from "@/db/schema/domain";
import { calculateRemainingDays, determineSubscriptionStatus } from "@/lib/portal";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user details
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        memberCode: user.memberCode,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = userData[0];

    // Fetch subscriptions
    const userSubscriptions = await db
      .select({
        id: subscription.id,
        planName: membershipPlan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        createdAt: subscription.createdAt,
      })
      .from(subscription)
      .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id))
      .where(eq(subscription.memberId, userId))
      .orderBy(desc(subscription.createdAt));

    const now = new Date();

    // Find active non-expired subscription
    const rawActiveSub = userSubscriptions.find((s) => {
      const statusInfo = determineSubscriptionStatus(s, now);
      return statusInfo.isActive;
    });

    const activeSubscription = rawActiveSub
      ? {
          id: rawActiveSub.id,
          planName: rawActiveSub.planName,
          startDate: rawActiveSub.startDate,
          endDate: rawActiveSub.endDate,
          status: rawActiveSub.status,
          daysRemaining: calculateRemainingDays(rawActiveSub.endDate, now),
        }
      : null;

    // Fetch personal check-ins
    const userCheckIns = await db
      .select({
        id: checkIn.id,
        status: checkIn.status,
        checkedInAt: checkIn.checkedInAt,
        scannedCode: checkIn.scannedCode,
        isOverride: checkIn.isOverride,
        overrideNotes: checkIn.overrideNotes,
      })
      .from(checkIn)
      .where(eq(checkIn.memberId, userId))
      .orderBy(desc(checkIn.checkedInAt))
      .limit(20);

    return NextResponse.json({
      user: currentUser,
      activeSubscription,
      hasExpiredOrNoSubscription: activeSubscription === null,
      checkIns: userCheckIns,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch portal dashboard data" },
      { status: 500 }
    );
  }
}
