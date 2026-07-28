import { describe, expect, test } from "bun:test";
import {
  isAuthorizedForCheckIn,
  evaluateEntryEligibility,
  validateCheckInInput,
  validateOverrideInput,
} from "./terminal";

describe("Check-in Terminal & Entry Verification Unit Tests", () => {
  describe("isAuthorizedForCheckIn", () => {
    test("allows admin and staff roles", () => {
      expect(isAuthorizedForCheckIn("admin")).toBe(true);
      expect(isAuthorizedForCheckIn("staff")).toBe(true);
    });

    test("denies member role or missing role", () => {
      expect(isAuthorizedForCheckIn("member")).toBe(false);
      expect(isAuthorizedForCheckIn(null)).toBe(false);
      expect(isAuthorizedForCheckIn(undefined)).toBe(false);
      expect(isAuthorizedForCheckIn("guest")).toBe(false);
    });
  });

  describe("evaluateEntryEligibility", () => {
    const now = new Date("2026-07-28T12:00:00Z");

    test("returns granted status when member has active non-expired subscription", () => {
      const subscriptions = [
        {
          id: "sub-1",
          planName: "Gold Plan",
          startDate: new Date("2026-07-01T00:00:00Z"),
          endDate: new Date("2026-08-01T00:00:00Z"),
          status: "active",
        },
      ];

      const result = evaluateEntryEligibility(subscriptions, now);
      expect(result.status).toBe("granted");
      expect(result.subscription?.planName).toBe("Gold Plan");
    });

    test("returns denied_expired status when member's subscription is expired", () => {
      const subscriptions = [
        {
          id: "sub-1",
          planName: "Monthly Pass",
          startDate: new Date("2026-06-01T00:00:00Z"),
          endDate: new Date("2026-07-01T00:00:00Z"),
          status: "active",
        },
      ];

      const result = evaluateEntryEligibility(subscriptions, now);
      expect(result.status).toBe("denied_expired");
      expect(result.subscription?.planName).toBe("Monthly Pass");
    });

    test("returns denied_no_plan status when member has no subscriptions", () => {
      const subscriptions: any[] = [];
      const result = evaluateEntryEligibility(subscriptions, now);
      expect(result.status).toBe("denied_no_plan");
      expect(result.subscription).toBeNull();
    });
  });

  describe("validateCheckInInput", () => {
    test("validates valid input with non-empty code", () => {
      const res = validateCheckInInput({ code: "GYM-1001" });
      expect(res.valid).toBe(true);
      expect(res.data?.code).toBe("GYM-1001");
    });

    test("trims whitespace from scanned code", () => {
      const res = validateCheckInInput({ code: "  GYM-1002  " });
      expect(res.valid).toBe(true);
      expect(res.data?.code).toBe("GYM-1002");
    });

    test("rejects missing or empty code", () => {
      expect(validateCheckInInput({}).valid).toBe(false);
      expect(validateCheckInInput({ code: "" }).valid).toBe(false);
      expect(validateCheckInInput({ code: "   " }).valid).toBe(false);
      expect(validateCheckInInput(null).valid).toBe(false);
    });
  });

  describe("validateOverrideInput", () => {
    test("validates valid override payload with memberId and notes", () => {
      const res = validateOverrideInput({
        memberId: "user-123",
        overrideNotes: "Forgot keycard",
      });
      expect(res.valid).toBe(true);
      expect(res.data?.memberId).toBe("user-123");
      expect(res.data?.overrideNotes).toBe("Forgot keycard");
    });

    test("rejects missing memberId", () => {
      expect(validateOverrideInput({ overrideNotes: "test" }).valid).toBe(false);
      expect(validateOverrideInput({ memberId: "" }).valid).toBe(false);
    });
  });
});
