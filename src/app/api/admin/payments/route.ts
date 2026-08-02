import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  validatePaymentInput,
  generateReceiptRef,
  calculateSubscriptionDates,
  isAuthorizedForPaymentManagement,
  filterPayments,
} from "@/lib/payments";
import { RowDataPacket } from "mysql2";

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

    const [paymentsList] = await db.query<RowDataPacket[]>(`
      SELECT 
        p.id, p.receipt_ref as receiptRef, p.amount, p.payment_method as paymentMethod, 
        p.status, p.notes, p.paid_at as paidAt, p.member_id as memberId, 
        u.name as memberName, u.email as memberEmail, u.member_code as memberCode, 
        p.subscription_id as subscriptionId, p.created_by_id as createdById
      FROM payment p
      INNER JOIN user u ON p.member_id = u.id
      ORDER BY p.paid_at DESC
    `);

    const [subs] = await db.query<RowDataPacket[]>(`
      SELECT s.id, p.name as planName, p.id as planId
      FROM subscription s
      INNER JOIN membership_plan p ON s.plan_id = p.id
    `);

    const subMap = new Map<string, { planId: string; planName: string }>();
    for (const sub of subs) {
      subMap.set(sub.id, { planId: sub.planId, planName: sub.planName });
    }

    const [staffUsers] = await db.query<RowDataPacket[]>(`SELECT id, name FROM user`);
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

    const [targetMember] = await db.query<RowDataPacket[]>(
      `SELECT id FROM user WHERE id = ? LIMIT 1`,
      [memberId]
    );

    if (targetMember.length === 0) {
      return NextResponse.json(
        { error: "Selected member does not exist" },
        { status: 400 }
      );
    }

    const [targetPlan] = await db.query<RowDataPacket[]>(
      `SELECT id, name, duration_days as durationDays, price, is_active as isActive FROM membership_plan WHERE id = ? LIMIT 1`,
      [planId]
    );

    if (targetPlan.length === 0) {
      return NextResponse.json(
        { error: "Selected membership plan does not exist" },
        { status: 400 }
      );
    }

    const plan = targetPlan[0];
    if (!plan.isActive) {
      return NextResponse.json(
        { error: "Selected membership plan is inactive" },
        { status: 400 }
      );
    }

    const finalAmount = validation.data.amount ?? plan.price;
    const now = new Date();
    const { startDate, endDate } = calculateSubscriptionDates(plan.durationDays, now);

    const connection = await db.getConnection();
    let newPayment, activeSubId;
    
    try {
      await connection.beginTransaction();

      const [existingSub] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM subscription WHERE member_id = ? ORDER BY created_at DESC LIMIT 1`,
        [memberId]
      );

      if (existingSub.length > 0) {
        activeSubId = existingSub[0].id;
        await connection.query(
          `UPDATE subscription SET plan_id = ?, start_date = ?, end_date = ?, status = 'active', updated_at = ? WHERE id = ?`,
          [plan.id, startDate, endDate, now, activeSubId]
        );
      } else {
        activeSubId = crypto.randomUUID();
        await connection.query(
          `INSERT INTO subscription (id, member_id, plan_id, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
          [activeSubId, memberId, plan.id, startDate, endDate, now, now]
        );
      }

      const [existingPayments] = await connection.query<RowDataPacket[]>(
        `SELECT receipt_ref as receiptRef FROM payment WHERE receipt_ref IS NOT NULL`
      );

      const existingRefs = existingPayments
        .map((p) => p.receiptRef)
        .filter((r): r is string => Boolean(r));

      const receiptRef = generateReceiptRef(now, existingRefs);

      newPayment = {
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

      await connection.query(
        `INSERT INTO payment (id, member_id, subscription_id, amount, payment_method, receipt_ref, notes, created_by_id, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newPayment.id, newPayment.memberId, newPayment.subscriptionId, newPayment.amount, newPayment.paymentMethod, newPayment.receiptRef, newPayment.notes, newPayment.createdById, newPayment.status, newPayment.paidAt]
      );

      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

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
