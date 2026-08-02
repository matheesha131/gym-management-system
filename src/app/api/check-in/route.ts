import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  isAuthorizedForCheckIn,
  evaluateEntryEligibility,
  validateCheckInInput,
  validateOverrideInput,
} from "@/lib/terminal";
import { RowDataPacket } from "mysql2";

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

      const [members] = await db.query<RowDataPacket[]>(`
        SELECT id, name, email, member_code as memberCode
        FROM user
        WHERE id = ? LIMIT 1
      `, [val.data.memberId]);

      if (members.length === 0) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      targetMember = members[0] as any;
      finalStatus = "granted";
      isOverride = true;
      overrideNotes = val.data.overrideNotes || "Staff manual override";
      scannedCode = val.data.scannedCode || targetMember!.memberCode || targetMember!.id;
    } else {
      const val = validateCheckInInput(body);
      if (!val.valid || !val.data) {
        return NextResponse.json({ error: val.error }, { status: 400 });
      }

      scannedCode = val.data.code;

      const [members] = await db.query<RowDataPacket[]>(`
        SELECT id, name, email, member_code as memberCode
        FROM user
        WHERE member_code = ? OR id = ? OR LOWER(email) = ?
        LIMIT 1
      `, [scannedCode, scannedCode, scannedCode.toLowerCase()]);

      if (members.length === 0) {
        return NextResponse.json(
          { error: `No member found with code or identifier '${scannedCode}'` },
          { status: 404 }
        );
      }

      targetMember = members[0] as any;

      const [userSubs] = await db.query<RowDataPacket[]>(`
        SELECT 
          s.id, p.name as planName, s.start_date as startDate, 
          s.end_date as endDate, s.status
        FROM subscription s
        INNER JOIN membership_plan p ON s.plan_id = p.id
        WHERE s.member_id = ?
        ORDER BY s.created_at DESC
      `, [targetMember!.id]);

      const evalResult = evaluateEntryEligibility(userSubs, now);
      finalStatus = evalResult.status;
      matchedSub = evalResult.subscription;
    }

    if (isOverride && targetMember) {
      const [userSubs] = await db.query<RowDataPacket[]>(`
        SELECT 
          s.id, p.name as planName, s.start_date as startDate, 
          s.end_date as endDate, s.status
        FROM subscription s
        INNER JOIN membership_plan p ON s.plan_id = p.id
        WHERE s.member_id = ?
        ORDER BY s.created_at DESC
      `, [targetMember.id]);

      const evalResult = evaluateEntryEligibility(userSubs, now);
      matchedSub = evalResult.subscription;
    }

    const newCheckInId = crypto.randomUUID();

    await db.query(`
      INSERT INTO check_in (id, member_id, scanned_code, status, is_override, override_notes, created_by_id, checked_in_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newCheckInId,
      targetMember!.id,
      scannedCode,
      finalStatus,
      isOverride,
      overrideNotes,
      session.user.id,
      now
    ]);

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

    const [logs] = await db.query<RowDataPacket[]>(`
      SELECT 
        c.id, c.status, c.scanned_code as scannedCode, 
        c.is_override as isOverride, c.override_notes as overrideNotes, 
        c.checked_in_at as checkedInAt, c.member_id as memberId, 
        u.name as memberName, u.email as memberEmail, u.member_code as memberCode
      FROM check_in c
      INNER JOIN user u ON c.member_id = u.id
      ORDER BY c.checked_in_at DESC
      LIMIT ?
    `, [limit]);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error in GET /api/check-in:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch check-in logs" },
      { status: 500 }
    );
  }
}
