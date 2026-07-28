import { describe, expect, test } from "bun:test";
import {
  isAuthorizedForClassManagement,
  validateClassInput,
  validateScheduleInput,
  canBookClass,
  canCancelBooking,
} from "./classes";

describe("Gym Class Scheduling & Member Booking Unit Tests", () => {
  describe("isAuthorizedForClassManagement", () => {
    test("allows admin and staff roles", () => {
      expect(isAuthorizedForClassManagement("admin")).toBe(true);
      expect(isAuthorizedForClassManagement("staff")).toBe(true);
    });

    test("denies member role or null/undefined", () => {
      expect(isAuthorizedForClassManagement("member")).toBe(false);
      expect(isAuthorizedForClassManagement(null)).toBe(false);
      expect(isAuthorizedForClassManagement(undefined)).toBe(false);
    });
  });

  describe("validateClassInput", () => {
    test("validates valid gym class input", () => {
      const res = validateClassInput({
        name: "Yoga Fundamentals",
        description: "Relaxing yoga for beginners",
        capacity: 15,
      });

      expect(res.valid).toBe(true);
      expect(res.data?.name).toBe("Yoga Fundamentals");
      expect(res.data?.capacity).toBe(15);
    });

    test("rejects missing or empty name", () => {
      expect(validateClassInput({ name: "" }).valid).toBe(false);
      expect(validateClassInput({ name: "   " }).valid).toBe(false);
      expect(validateClassInput(null).valid).toBe(false);
    });

    test("rejects invalid capacity", () => {
      expect(validateClassInput({ name: "Spin", capacity: 0 }).valid).toBe(false);
      expect(validateClassInput({ name: "Spin", capacity: -5 }).valid).toBe(false);
    });
  });

  describe("validateScheduleInput", () => {
    test("validates valid schedule input with end time after start time", () => {
      const res = validateScheduleInput({
        classId: "class-123",
        startTime: "2026-08-01T10:00:00Z",
        endTime: "2026-08-01T11:00:00Z",
      });

      expect(res.valid).toBe(true);
      expect(res.data?.classId).toBe("class-123");
    });

    test("rejects schedule with end time before or equal to start time", () => {
      const res = validateScheduleInput({
        classId: "class-123",
        startTime: "2026-08-01T10:00:00Z",
        endTime: "2026-08-01T09:00:00Z",
      });

      expect(res.valid).toBe(false);
      expect(res.error).toBe("End time must be after start time");
    });

    test("rejects missing classId", () => {
      expect(
        validateScheduleInput({
          startTime: "2026-08-01T10:00:00Z",
          endTime: "2026-08-01T11:00:00Z",
        }).valid
      ).toBe(false);
    });
  });

  describe("canBookClass", () => {
    const now = new Date("2026-07-28T12:00:00Z");

    test("allows booking when capacity is available and member not booked", () => {
      const schedule = {
        currentBookings: 10,
        capacity: 20,
        startTime: new Date("2026-08-01T10:00:00Z"),
      };

      const res = canBookClass(schedule, null, now);
      expect(res.canBook).toBe(true);
    });

    test("prevents booking when class is fully booked", () => {
      const schedule = {
        currentBookings: 20,
        capacity: 20,
        startTime: new Date("2026-08-01T10:00:00Z"),
      };

      const res = canBookClass(schedule, null, now);
      expect(res.canBook).toBe(false);
      expect(res.reason).toBe("Class session is fully booked");
    });

    test("prevents double booking when member is already booked", () => {
      const schedule = {
        currentBookings: 5,
        capacity: 20,
        startTime: new Date("2026-08-01T10:00:00Z"),
      };

      const existingBooking = { id: "booking-1", status: "booked" };

      const res = canBookClass(schedule, existingBooking, now);
      expect(res.canBook).toBe(false);
      expect(res.reason).toBe("You are already booked for this class");
    });

    test("prevents booking past class sessions", () => {
      const schedule = {
        currentBookings: 2,
        capacity: 20,
        startTime: new Date("2026-07-20T10:00:00Z"), // Past date
      };

      const res = canBookClass(schedule, null, now);
      expect(res.canBook).toBe(false);
      expect(res.reason).toBe("Cannot book a past class session");
    });
  });

  describe("canCancelBooking", () => {
    const now = new Date("2026-07-28T12:00:00Z");

    test("allows cancelling active booking", () => {
      const booking = { id: "b-1", status: "booked" };
      const schedule = { currentBookings: 1, capacity: 20, startTime: new Date("2026-08-01T10:00:00Z") };

      const res = canCancelBooking(booking, schedule, now);
      expect(res.canCancel).toBe(true);
    });

    test("prevents cancelling already cancelled booking", () => {
      const booking = { id: "b-1", status: "cancelled" };
      const schedule = { currentBookings: 0, capacity: 20, startTime: new Date("2026-08-01T10:00:00Z") };

      const res = canCancelBooking(booking, schedule, now);
      expect(res.canCancel).toBe(false);
      expect(res.reason).toBe("Booking is already cancelled");
    });
  });
});
