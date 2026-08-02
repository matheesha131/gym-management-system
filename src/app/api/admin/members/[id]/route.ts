import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isAuthorizedForMemberManagement } from "@/lib/members";
import { RowDataPacket } from "mysql2";

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

    const [targetUser] = await db.query<RowDataPacket[]>(`
      SELECT 
        id, name, email, phone_number as phoneNumber, member_code as memberCode,
        role, created_at as createdAt, updated_at as updatedAt
      FROM user
      WHERE id = ? LIMIT 1
    `, [id]);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const member = targetUser[0];

    const [subscriptions] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, s.plan_id as planId, p.name as planName, 
        s.start_date as startDate, s.end_date as endDate, 
        s.status, s.created_at as createdAt
      FROM subscription s
      INNER JOIN membership_plan p ON s.plan_id = p.id
      WHERE s.member_id = ?
      ORDER BY s.created_at DESC
    `, [id]);

    const [checkIns] = await db.query<RowDataPacket[]>(`
      SELECT 
        id, status, scanned_code as scannedCode, 
        is_override as isOverride, override_notes as overrideNotes, 
        checked_in_at as checkedInAt
      FROM check_in
      WHERE member_id = ?
      ORDER BY checked_in_at DESC
      LIMIT 10
    `, [id]);

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
