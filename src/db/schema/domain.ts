import { mysqlTable, varchar, text, timestamp, decimal, int, boolean } from "drizzle-orm/mysql-core";
import { user } from "./auth";

export const SUBSCRIPTION_STATUSES = ["active", "expired", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const CHECKIN_STATUSES = ["granted", "denied_expired", "denied_no_plan"] as const;
export type CheckInStatus = (typeof CHECKIN_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "stripe"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["completed", "pending", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = ["booked", "confirmed", "cancelled", "attended"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Membership Plans (Monthly, Annual, Day Pass, etc.)
export const membershipPlan = mysqlTable("membership_plan", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationDays: int("duration_days").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Member Subscriptions
export const subscription = mysqlTable("subscription", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memberId: varchar("member_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 36 })
    .notNull()
    .references(() => membershipPlan.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Check-ins Log
export const checkIn = mysqlTable("check_in", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memberId: varchar("member_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  scannedCode: varchar("scanned_code", { length: 100 }),
  status: varchar("status", { length: 30 }).notNull(),
  isOverride: boolean("is_override").default(false).notNull(),
  overrideNotes: text("override_notes"),
  createdById: varchar("created_by_id", { length: 36 }).references(() => user.id),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
});

// Gym Classes
export const gymClass = mysqlTable("gym_class", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  trainerId: varchar("trainer_id", { length: 36 }).references(() => user.id),
  capacity: int("capacity").default(20).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled Class Sessions
export const classSchedule = mysqlTable("class_schedule", {
  id: varchar("id", { length: 36 }).primaryKey(),
  classId: varchar("class_id", { length: 36 })
    .notNull()
    .references(() => gymClass.id, { onDelete: "cascade" }),
  trainerId: varchar("trainer_id", { length: 36 }).references(() => user.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  currentBookings: int("current_bookings").default(0).notNull(),
});

// Member Class Bookings
export const classBooking = mysqlTable("class_booking", {
  id: varchar("id", { length: 36 }).primaryKey(),
  scheduleId: varchar("schedule_id", { length: 36 })
    .notNull()
    .references(() => classSchedule.id, { onDelete: "cascade" }),
  memberId: varchar("member_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).default("confirmed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Financial Payments
export const payment = mysqlTable("payment", {
  id: varchar("id", { length: 36 }).primaryKey(),
  memberId: varchar("member_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: varchar("subscription_id", { length: 36 }).references(() => subscription.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(),
  receiptRef: varchar("receipt_ref", { length: 50 }),
  notes: text("notes"),
  createdById: varchar("created_by_id", { length: 36 }).references(() => user.id),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
});
