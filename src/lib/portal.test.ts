import { describe, expect, test } from "bun:test";
import {
  calculateRemainingDays,
  determineSubscriptionStatus,
  formatCheckInStatus,
} from "./portal";

describe("Member Portal & Attendance History Unit Tests", () => {
  describe("calculateRemainingDays", () => {
    test("calculates positive remaining days when end date is in the future", () => {
      const now = new Date("2026-07-28T12:00:00Z");
      const endDate = new Date("2026-08-07T12:00:00Z"); // 10 days later
      const days = calculateRemainingDays(endDate, now);
      expect(days).toBe(10);
    });

    test("returns 0 when end date is in the past", () => {
      const now = new Date("2026-07-28T12:00:00Z");
      const endDate = new Date("2026-07-25T12:00:00Z");
      const days = calculateRemainingDays(endDate, now);
      expect(days).toBe(0);
    });

    test("returns 0 when end date is right now", () => {
      const now = new Date("2026-07-28T12:00:00Z");
      const days = calculateRemainingDays(now, now);
      expect(days).toBe(0);
    });
  });

  describe("determineSubscriptionStatus", () => {
    test("returns active status and remaining days for valid active subscription", () => {
      const now = new Date("2026-07-28T12:00:00Z");
      const endDate = new Date("2026-08-27T12:00:00Z"); // 30 days
      const result = determineSubscriptionStatus(
        { status: "active", endDate },
        now
      );

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBe(30);
      expect(result.statusText).toBe("Active");
    });

    test("returns inactive/expired status when subscription status is active but endDate passed", () => {
      const now = new Date("2026-07-28T12:00:00Z");
      const endDate = new Date("2026-07-20T12:00:00Z");
      const result = determineSubscriptionStatus(
        { status: "active", endDate },
        now
      );

      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.statusText).toBe("Expired");
    });

    test("returns inactive status when no subscription present", () => {
      const result = determineSubscriptionStatus(null);
      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBe(0);
      expect(result.statusText).toBe("No Subscription");
    });
  });

  describe("formatCheckInStatus", () => {
    test("formats known check-in statuses correctly", () => {
      expect(formatCheckInStatus("granted")).toBe("Access Granted");
      expect(formatCheckInStatus("denied_expired")).toBe("Access Denied (Expired)");
      expect(formatCheckInStatus("denied_no_plan")).toBe("Access Denied (No Active Plan)");
      expect(formatCheckInStatus("unknown")).toBe("unknown");
    });
  });
});
