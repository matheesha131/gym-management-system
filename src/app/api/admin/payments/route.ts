import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscription, membershipPlan, payment } from "@/db/schema/domain";
import {
  validatePaymentInput,
  generateReceiptRef,
  calculateSubscriptionDates,
  isAuthorizedForPaymentManagement,
  filterPayments,
} from "@/lib/payments";
import { eq, desc, isNotNull, like, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAuthorizedForPaymentManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

    // Fetch payments with joined member, plan, and createdBy staff details
    const paymentsList = await db
      .select({
        id: payment.id,
        receiptRef: payment.receiptRef,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        notes: payment.notes,
        paidAt: payment.paidAt,
        memberId: payment.memberId,
        memberName: user.name,
        memberEmail: user.email,
        memberCode: user.memberCode,
        subscriptionId: payment.subscriptionId,
        createdById: payment.createdById,
      })
      .from(payment)
      .innerJoin(user, eq(payment.memberId, user.id))
      .orderBy(desc(payment.paidAt));

    // Fetch subscriptions and plans to attach plan details
    const subs = await db
      .select({
        id: subscription.id,
        planName: membershipPlan.name,
        planId: membershipPlan.id,
      })
      .from(subscription)
      .innerJoin(membershipPlan, eq(subscription.planId, membershipPlan.id));

    const subMap = new Map<string, { planId: string; planName: string }>();
    for (const sub of subs) {
      subMap.set(sub.id, { planId: sub.planId, planName: sub.planName });
    }

    // Fetch staff user names
    const staffUsers = await db
      .select({ id: user.id, name: user.name })
      .from(user);
    const staffMap = new Map<string, string>();
    for (const s of staffUsers) {
      staffMap.set(s.id, s.name);
    }

    const formattedPayments = paymentsList.map((p) => {
      const subInfo = p.subscriptionId ? subMap.get(p.subscriptionId) : null;
      const createdByName = p.createdById ? staffMap.get(p.createdById) : null;

      return {
        id: p.id,
        receiptRef: p.receiptRef || "N/A",
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        status: p.status,
        notes: p.notes,
        paidAt: p.paidAt,
        member: {
          id: p.memberId,
          name: p.memberName,
          email: p.memberEmail,
          memberCode: p.memberCode,
        },
        plan: subInfo ? { id: subInfo.planId, name: subInfo.planName } : null,
        createdBy: createdByName
          ? { id: p.createdById!, name: createdByName }
          : null,
      };
    });

    const filtered = filterPayments(formattedPayments, searchQuery);

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch counter payment logs" },
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

    if (!isAuthorizedForPaymentManagement(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = validatePaymentInput(body);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { memberId, planId, paymentMethod, notes } = validation.data;

    // Verify member exists
    const targetMember = await db
      .select()
      .from(user)
      .where(eq(user.id, memberId))
      .limit(1);

    if (targetMember.length === 0) {
      return NextResponse.json(
        { error: "Selected member does not exist" },
        { status: 400 }
      );
    }

    // Verify plan exists
    const targetPlan = await db
      .select()
      .from(membershipPlan)
      .where(eq(membershipPlan.id, planId))
      .limit(1);

    if (targetPlan.length === 0) {
      return NextResponse.json(
        { error: "Selected membership plan does not exist" },
        { status: 400 }
      );
    }

    const plan = targetPlan[0];
    const finalAmount = validation.data.amount ?? plan.price;

    // Calculate subscription dates
    const now = new Date();
    const { startDate, endDate } = calculateSubscriptionDates(
      plan.durationDays,
      now
    );

    // Check if member has an existing subscription
    const existingSub = await db
      .select()
      .from(subscription)
      .where(eq(subscription.memberId, memberId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    let activeSubId: string;

    if (existingSub.length > 0) {
      activeSubId = existingSub[0].id;
      await db
        .update(subscription)
        .set({
          planId: plan.id,
          startDate,
          endDate,
          status: "active",
          updatedAt: now,
        })
        .where(eq(subscription.id, activeSubId));
    } else {
      activeSubId = crypto.randomUUID();
      await db.insert(subscription).values({
        id: activeSubId,
        memberId,
        planId: plan.id,
        startDate,
        endDate,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Generate unique receipt reference REC-YYYYMMDD-XXXX
    const existingPayments = await db
      .select({ receiptRef: payment.receiptRef })
      .from(payment)
      .where(isNotNull(payment.receiptRef));

    const existingRefs = existingPayments
      .map((p) => p.receiptRef)
      .filter((r): r is string => Boolean(r));

    const receiptRef = generateReceiptRef(now, existingRefs);

    const newPayment = {
      id: crypto.randomUUID(),
      memberId,
      subscriptionId: activeSubId,
      amount: finalAmount,
      paymentMethod,
      receiptRef,
      notes,
      createdById: session.user.id || null,
      status: "completed",
      paidAt: now,
    };

    await db.insert(payment).values(newPayment);

    return NextResponse.json(
      {
        payment: newPayment,
        subscription: {
          id: activeSubId,
          planId: plan.id,
          planName: plan.name,
          startDate,
          endDate,
          status: "active",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to log counter payment" },
      { status: 500 }
    );
  }
}
