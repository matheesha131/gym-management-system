import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { calculateRemainingDays, determineSubscriptionStatus } from "@/lib/portal";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [userData] = await db.query<RowDataPacket[]>(`
      SELECT id, name, email, member_code as memberCode, role
      FROM user
      WHERE id = ? LIMIT 1
    `, [userId]);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUser = userData[0];

    const [userSubscriptions] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, p.name as planName, s.start_date as startDate, 
        s.end_date as endDate, s.status, s.created_at as createdAt
      FROM subscription s
      INNER JOIN membership_plan p ON s.plan_id = p.id
      WHERE s.member_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    const now = new Date();

    const rawActiveSub = userSubscriptions.find((s) => {
      const statusInfo = determineSubscriptionStatus(s as any, now);
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

    const [userCheckIns] = await db.query<RowDataPacket[]>(`
      SELECT 
        id, status, checked_in_at as checkedInAt, scanned_code as scannedCode, 
        is_override as isOverride, override_notes as overrideNotes
      FROM check_in
      WHERE member_id = ?
      ORDER BY checked_in_at DESC
      LIMIT 20
    `, [userId]);

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
