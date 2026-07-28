import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscription, membershipPlan, checkIn } from "@/db/schema/domain";
import {
  isAuthorizedForCheckIn,
  evaluateEntryEligibility,
  validateCheckInInput,
  validateOverrideInput,
} from "@/lib/terminal";
import { eq, or, desc, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForCheckIn(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const now = new Date();

    let targetMember: {
      id: string;
      name: string;
      email: string;
      memberCode: string | null;
    } | null = null;

    let finalStatus: "granted" | "denied_expired" | "denied_no_plan";
    let isOverride = false;
    let overrideNotes: string | null = null;
    let scannedCode: string | null = null;
    let matchedSub: any = null;

    if (body.isOverride) {
      const val = validateOverrideInput(body);
      if (!val.valid || !val.data) {
        return NextResponse.json({ error: val.error }, { status: 400 });
      }

      const members = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          memberCode: user.memberCode,
        })
        .from(user)
        .where(eq(user.id, val.data.memberId))
        .limit(1);

      if (members.length === 0) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      targetMember = members[0];
      finalStatus = "granted";
      isOverride = true;
      overrideNotes = val.data.overrideNotes || "Staff manual override";
      scannedCode = val.data.scannedCode || targetMember.memberCode || targetMember.id;
    } else {
      const val = validateCheckInInput(body);
      if (!val.valid || !val.data) {
        return NextResponse.json({ error: val.error }, { status: 400 });
      }

      scannedCode = val.data.code;

      // Find member by memberCode, id, or email
      const members = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          memberCode: user.memberCode,
        })
        .from(user)
        .where(
          or(
            eq(user.memberCode, scannedCode),
            eq(user.id, scannedCode),
            eq(sql`LOWER(${user.email})`, scannedCode.toLowerCase())
          )
        )
        .limit(1);

      if (members.length === 0) {
        return NextResponse.json(
          { error: `No member found with code or identifier '${scannedCode}'` },
          { status: 404 }
        );
      }

      targetMember = members[0];

      // Fetch subscriptions for member
      const userSubs = await db
        .select({
          id: subscription.id,
          planName: membershipPlan.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        })
        .from(subscription)
        .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id))
        .where(eq(subscription.memberId, targetMember.id))
        .orderBy(desc(subscription.createdAt));

      const evalResult = evaluateEntryEligibility(userSubs, now);
      finalStatus = evalResult.status;
      matchedSub = evalResult.subscription;
    }

    // If override, fetch subscription info for display card if not fetched yet
    if (isOverride && targetMember) {
      const userSubs = await db
        .select({
          id: subscription.id,
          planName: membershipPlan.name,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          status: subscription.status,
        })
        .from(subscription)
        .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id))
        .where(eq(subscription.memberId, targetMember.id))
        .orderBy(desc(subscription.createdAt));

      const evalResult = evaluateEntryEligibility(userSubs, now);
      matchedSub = evalResult.subscription;
    }

    const newCheckInId = crypto.randomUUID();

    await db.insert(checkIn).values({
      id: newCheckInId,
      memberId: targetMember.id,
      scannedCode: scannedCode,
      status: finalStatus,
      isOverride: isOverride,
      overrideNotes: overrideNotes,
      createdById: session.user.id,
      checkedInAt: now,
    });

    return NextResponse.json({
      checkIn: {
        id: newCheckInId,
        status: finalStatus,
        isOverride: isOverride,
        overrideNotes: overrideNotes,
        checkedInAt: now.toISOString(),
      },
      member: targetMember,
      subscription: matchedSub
        ? {
            id: matchedSub.id,
            planName: matchedSub.planName,
            endDate: matchedSub.endDate,
            status: matchedSub.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Error in POST /api/check-in:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process check-in" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForCheckIn(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const logs = await db
      .select({
        id: checkIn.id,
        status: checkIn.status,
        scannedCode: checkIn.scannedCode,
        isOverride: checkIn.isOverride,
        overrideNotes: checkIn.overrideNotes,
        checkedInAt: checkIn.checkedInAt,
        memberId: checkIn.memberId,
        memberName: user.name,
        memberEmail: user.email,
        memberCode: user.memberCode,
      })
      .from(checkIn)
      .innerJoin(user, eq(checkIn.memberId, user.id))
      .orderBy(desc(checkIn.checkedInAt))
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error in GET /api/check-in:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch check-in logs" },
      { status: 500 }
    );
  }
}
