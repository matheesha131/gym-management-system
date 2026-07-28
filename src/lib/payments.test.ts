import { describe, expect, test } from "bun:test";
import {
  validatePaymentInput,
  generateReceiptRef,
  calculateSubscriptionDates,
  isAuthorizedForPaymentManagement,
  filterPayments,
  PaymentRecord,
} from "./payments";

describe("Counter Payment Logging & Subscription Auto-Activation Unit Tests", () => {
  describe("validatePaymentInput", () => {
    test("validates valid payment input", () => {
      const result = validatePaymentInput({
        memberId: "user-123",
        planId: "plan-456",
        paymentMethod: "cash",
        amount: 49.99,
        notes: "Paid at counter",
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        memberId: "user-123",
        planId: "plan-456",
        paymentMethod: "cash",
        amount: "49.99",
        notes: "Paid at counter",
      });
    });

    test("accepts valid payment methods", () => {
      const methods = ["cash", "card_counter", "card", "bank_transfer", "stripe"];
      for (const method of methods) {
        const res = validatePaymentInput({
          memberId: "user-1",
          planId: "plan-1",
          paymentMethod: method,
        });
        expect(res.valid).toBe(true);
      }
    });

    test("rejects missing memberId", () => {
      const res = validatePaymentInput({
        planId: "plan-456",
        paymentMethod: "cash",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Member selection is required");
    });

    test("rejects missing planId", () => {
      const res = validatePaymentInput({
        memberId: "user-123",
        paymentMethod: "cash",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Plan selection is required");
    });

    test("rejects invalid payment method", () => {
      const res = validatePaymentInput({
        memberId: "user-123",
        planId: "plan-456",
        paymentMethod: "crypto",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Invalid payment method");
    });

    test("rejects negative amount", () => {
      const res = validatePaymentInput({
        memberId: "user-123",
        planId: "plan-456",
        paymentMethod: "cash",
        amount: -10,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Amount must be a non-negative number");
    });
  });

  describe("generateReceiptRef", () => {
    test("generates REC-YYYYMMDD-1001 when no existing refs for date", () => {
      const testDate = new Date("2026-07-28T10:00:00Z");
      const ref = generateReceiptRef(testDate, []);
      expect(ref).toBe("REC-20260728-1001");
    });

    test("increments sequence for same date", () => {
      const testDate = new Date("2026-07-28T10:00:00Z");
      const existing = ["REC-20260728-1001", "REC-20260728-1002"];
      const ref = generateReceiptRef(testDate, existing);
      expect(ref).toBe("REC-20260728-1003");
    });

    test("ignores receipt refs from other dates", () => {
      const testDate = new Date("2026-07-28T10:00:00Z");
      const existing = ["REC-20260727-1050", "REC-20260728-1001"];
      const ref = generateReceiptRef(testDate, existing);
      expect(ref).toBe("REC-20260728-1002");
    });
  });

  describe("calculateSubscriptionDates", () => {
    test("calculates correct start and end date based on durationDays", () => {
      const startDate = new Date("2026-07-28T12:00:00Z");
      const { startDate: start, endDate: end } = calculateSubscriptionDates(30, startDate);

      expect(start.toISOString()).toBe(startDate.toISOString());
      // 30 days = 30 * 24 * 60 * 60 * 1000 ms
      const expectedEnd = new Date(startDate.getTime() + 30 * 86400000);
      expect(end.toISOString()).toBe(expectedEnd.toISOString());
    });
  });

  describe("isAuthorizedForPaymentManagement", () => {
    test("allows admin and staff roles", () => {
      expect(isAuthorizedForPaymentManagement("admin")).toBe(true);
      expect(isAuthorizedForPaymentManagement("staff")).toBe(true);
    });

    test("denies member role or null/undefined", () => {
      expect(isAuthorizedForPaymentManagement("member")).toBe(false);
      expect(isAuthorizedForPaymentManagement(null)).toBe(false);
      expect(isAuthorizedForPaymentManagement(undefined)).toBe(false);
    });
  });

  describe("filterPayments", () => {
    const mockPayments: PaymentRecord[] = [
      {
        id: "1",
        receiptRef: "REC-20260728-1001",
        amount: "50.00",
        paymentMethod: "cash",
        status: "completed",
        paidAt: new Date(),
        member: { id: "m1", name: "John Doe", email: "john@test.com", memberCode: "GYM-1001" },
        plan: { id: "p1", name: "Monthly Pass" },
        createdBy: { id: "s1", name: "Staff Member" },
      },
      {
        id: "2",
        receiptRef: "REC-20260728-1002",
        amount: "500.00",
        paymentMethod: "card_counter",
        status: "completed",
        paidAt: new Date(),
        member: { id: "m2", name: "Jane Smith", email: "jane@test.com", memberCode: "GYM-1002" },
        plan: { id: "p2", name: "Annual VIP" },
        createdBy: { id: "s1", name: "Staff Member" },
      },
    ];

    test("returns all payments on empty query", () => {
      expect(filterPayments(mockPayments, "")).toHaveLength(2);
    });

    test("filters by receiptRef", () => {
      const result = filterPayments(mockPayments, "1002");
      expect(result).toHaveLength(1);
      expect(result[0].receiptRef).toBe("REC-20260728-1002");
    });

    test("filters by member name or code", () => {
      const res1 = filterPayments(mockPayments, "John");
      expect(res1).toHaveLength(1);
      expect(res1[0].member.name).toBe("John Doe");

      const res2 = filterPayments(mockPayments, "gym-1002");
      expect(res2).toHaveLength(1);
      expect(res2[0].member.name).toBe("Jane Smith");
    });
  });
});
