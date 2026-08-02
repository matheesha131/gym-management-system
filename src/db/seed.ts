import { auth } from "@/lib/auth";
import { db } from "@/db";
import { RowDataPacket } from "mysql2";

async function seed() {
  console.log("🌱 Starting database seed for Gym Management System...");

  const defaultUsers = [
    {
      name: "Alex Johnson (Admin)",
      email: "admin@gym.com",
      password: "Password123!",
      role: "admin",
      memberCode: "GYM-1000",
    },
    {
      name: "Sarah Conner (Staff)",
      email: "staff@gym.com",
      password: "Password123!",
      role: "staff",
      memberCode: "GYM-1002",
    },
    {
      name: "John Doe (Member)",
      email: "member@gym.com",
      password: "Password123!",
      role: "member",
      memberCode: "GYM-1001",
    },
  ];

  for (const u of defaultUsers) {
    try {
      console.log(`Creating user ${u.email} (${u.role})...`);
      const created = await auth.api.signUpEmail({
        body: {
          name: u.name,
          email: u.email,
          password: u.password,
        },
      });

      if (created?.user?.id) {
        await db.query(
          `UPDATE user SET role = ?, member_code = ? WHERE id = ?`,
          [u.role, u.memberCode, created.user.id]
        );
      }
    } catch (err: any) {
      console.log(`User ${u.email} might already exist or notice:`, err.message || err);
      await db.query(
        `UPDATE user SET role = ?, member_code = ? WHERE email = ?`,
        [u.role, u.memberCode, u.email]
      );
    }
  }

  const [existingPlans] = await db.query<RowDataPacket[]>(`SELECT id FROM membership_plan LIMIT 1`);
  if (existingPlans.length === 0) {
    console.log("Seeding default membership plans...");
    await db.query(`
      INSERT INTO membership_plan (id, name, description, duration_days, price, is_active)
      VALUES 
      (?, 'Standard Monthly Pass', 'Full access to gym equipment and facilities for 30 days.', 30, '49.99', true),
      (?, 'Annual VIP Membership', 'Unlimited 365-day access including group classes & personal trainer discounts.', 365, '499.99', true),
      (?, 'Day Pass', 'Single-day drop-in access to gym floor.', 1, '15.00', true)
    `, [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]);
  }

  const [existingClasses] = await db.query<RowDataPacket[]>(`SELECT id FROM gym_class LIMIT 1`);
  if (existingClasses.length === 0) {
    console.log("Seeding default gym classes...");
    const classId1 = crypto.randomUUID();
    const classId2 = crypto.randomUUID();

    const [staffUser] = await db.query<RowDataPacket[]>(`SELECT id FROM user WHERE email = 'staff@gym.com' LIMIT 1`);
    const trainerId = staffUser[0]?.id || null;

    await db.query(`
      INSERT INTO gym_class (id, name, description, capacity, trainer_id)
      VALUES 
      (?, 'HIIT Power Hour', 'High-intensity interval training designed to burn calories and build stamina.', 15, ?),
      (?, 'Yoga & Core Alignment', 'Relaxing posture alignment, flexibility, and core stability exercises.', 20, ?)
    `, [classId1, trainerId, classId2, trainerId]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(11, 0, 0, 0);

    await db.query(`
      INSERT INTO class_schedule (id, class_id, trainer_id, start_time, end_time, current_bookings)
      VALUES (?, ?, ?, ?, ?, 0)
    `, [crypto.randomUUID(), classId1, trainerId, tomorrow, endTomorrow]);
  }

  console.log("✅ Database seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
