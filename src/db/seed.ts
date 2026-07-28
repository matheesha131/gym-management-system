import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { membershipPlan, gymClass, classSchedule } from "@/db/schema/domain";
import { eq } from "drizzle-orm";

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
        await db
          .update(user)
          .set({
            role: u.role,
            memberCode: u.memberCode,
          })
          .where(eq(user.id, created.user.id));
      }
    } catch (err: any) {
      console.log(`User ${u.email} might already exist or notice:`, err.message || err);
      // Ensure role & memberCode updated even if already created
      await db
        .update(user)
        .set({
          role: u.role,
          memberCode: u.memberCode,
        })
        .where(eq(user.email, u.email));
    }
  }

  // Seed Membership Plans if empty
  const existingPlans = await db.select().from(membershipPlan);
  if (existingPlans.length === 0) {
    console.log("Seeding default membership plans...");
    await db.insert(membershipPlan).values([
      {
        id: crypto.randomUUID(),
        name: "Standard Monthly Pass",
        description: "Full access to gym equipment and facilities for 30 days.",
        durationDays: 30,
        price: "49.99",
        isActive: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Annual VIP Membership",
        description: "Unlimited 365-day access including group classes & personal trainer discounts.",
        durationDays: 365,
        price: "499.99",
        isActive: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Day Pass",
        description: "Single-day drop-in access to gym floor.",
        durationDays: 1,
        price: "15.00",
        isActive: true,
      },
    ]);
  }

  // Seed Gym Classes if empty
  const existingClasses = await db.select().from(gymClass);
  if (existingClasses.length === 0) {
    console.log("Seeding default gym classes...");
    const classId1 = crypto.randomUUID();
    const classId2 = crypto.randomUUID();

    const staffUser = await db.select().from(user).where(eq(user.email, "staff@gym.com")).limit(1);
    const trainerId = staffUser[0]?.id || null;

    await db.insert(gymClass).values([
      {
        id: classId1,
        name: "HIIT Power Hour",
        description: "High-intensity interval training designed to burn calories and build stamina.",
        capacity: 15,
        trainerId,
      },
      {
        id: classId2,
        name: "Yoga & Core Alignment",
        description: "Relaxing posture alignment, flexibility, and core stability exercises.",
        capacity: 20,
        trainerId,
      },
    ]);

    // Schedule sample session for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setHours(11, 0, 0, 0);

    await db.insert(classSchedule).values({
      id: crypto.randomUUID(),
      classId: classId1,
      trainerId,
      startTime: tomorrow,
      endTime: endTomorrow,
      currentBookings: 0,
    });
  }

  console.log("✅ Database seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
