import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscription, membershipPlan } from "@/db/schema/domain";
import {
  validateMemberInput,
  generateMemberCode,
  isAuthorizedForMemberManagement,
  filterMembers,
} from "@/lib/members";
import { eq, desc, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

    // Fetch members (role = 'member' or memberCode is set)
    const membersList = await db
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
      .where(eq(user.role, "member"))
      .orderBy(desc(user.createdAt));

    // Fetch active subscriptions with plan details for each member
    const activeSubs = await db
      .select({
        id: subscription.id,
        memberId: subscription.memberId,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        planName: membershipPlan.name,
      })
      .from(subscription)
      .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id))
      .where(eq(subscription.status, "active"));

    // Map active subscriptions to member records
    const now = new Date();
    const subMap = new Map<string, (typeof activeSubs)[0]>();
    for (const sub of activeSubs) {
      const isNotExpired = new Date(sub.endDate) > now;
      if (isNotExpired && !subMap.has(sub.memberId)) {
        subMap.set(sub.memberId, sub);
      }
    }

    const membersWithSubs = membersList.map((m) => {
      const activeSub = subMap.get(m.id);
      return {
        ...m,
        activeSubscription: activeSub
          ? {
              id: activeSub.id,
              planName: activeSub.planName,
              startDate: activeSub.startDate,
              endDate: activeSub.endDate,
              status: activeSub.status,
            }
          : null,
      };
    });

    const filtered = filterMembers(membersWithSubs, searchQuery);

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
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

    if (!isAuthorizedForMemberManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = validateMemberInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, validation.data.email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    // Generate unique memberCode
    const existingUsers = await db
      .select({ memberCode: user.memberCode })
      .from(user)
      .where(isNotNull(user.memberCode));

    const existingCodes = existingUsers
      .map((u) => u.memberCode)
      .filter((c): c is string => Boolean(c));

    const memberCode = generateMemberCode(existingCodes);

    const newMember = {
      id: crypto.randomUUID(),
      name: validation.data.name,
      email: validation.data.email,
      phoneNumber: validation.data.phoneNumber,
      memberCode,
      role: "member",
      emailVerified: false,
    };

    await db.insert(user).values(newMember);

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member record" },
      { status: 500 }
    );
  }
}
