import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  validateMemberInput,
  generateMemberCode,
  isAuthorizedForMemberManagement,
  filterMembers,
} from "@/lib/members";
import { RowDataPacket } from "mysql2";

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

    const [membersList] = await db.query<RowDataPacket[]>(`
      SELECT 
        id, name, email, phone_number as phoneNumber, 
        member_code as memberCode, role, created_at as createdAt, updated_at as updatedAt
      FROM user
      WHERE role = 'member'
      ORDER BY created_at DESC
    `);

    const [activeSubs] = await db.query<RowDataPacket[]>(`
      SELECT 
        s.id, s.member_id as memberId, s.start_date as startDate, 
        s.end_date as endDate, s.status, p.name as planName
      FROM subscription s
      INNER JOIN membership_plan p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `);

    const now = new Date();
    const subMap = new Map<string, any>();
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

    const [existing] = await db.query<RowDataPacket[]>(
      `SELECT id FROM user WHERE email = ? LIMIT 1`,
      [validation.data.email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 400 }
      );
    }

    const [existingUsers] = await db.query<RowDataPacket[]>(
      `SELECT member_code as memberCode FROM user WHERE member_code IS NOT NULL`
    );

    const existingCodes = existingUsers
      .map((u) => u.memberCode)
      .filter((c): c is string => Boolean(c));

    const memberCode = generateMemberCode(existingCodes);
    const newMemberId = crypto.randomUUID();

    const newMember = {
      id: newMemberId,
      name: validation.data.name,
      email: validation.data.email,
      phoneNumber: validation.data.phoneNumber,
      memberCode,
      role: "member",
      emailVerified: false,
    };

    await db.query(`
      INSERT INTO user (id, name, email, phone_number, member_code, role, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      newMember.id,
      newMember.name,
      newMember.email,
      newMember.phoneNumber || null,
      newMember.memberCode,
      newMember.role,
      newMember.emailVerified
    ]);

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member record" },
      { status: 500 }
    );
  }
}
