import { describe, test, expect } from "bun:test";
import { validatePlanInput, isAuthorizedForPlanMutation } from "./plans";

describe("Membership Plan Validation & RBAC", () => {
  describe("validatePlanInput", () => {
    test("validates valid plan input", () => {
      const result = validatePlanInput({
        name: "Monthly Pass",
        description: "Access for 30 days",
        durationDays: 30,
        price: 49.99,
        isActive: true,
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: "Monthly Pass",
        description: "Access for 30 days",
        durationDays: 30,
        price: "49.99",
        isActive: true,
      });
    });

    test("rejects missing name", () => {
      const result = validatePlanInput({
        name: "",
        durationDays: 30,
        price: 49.99,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Name");
    });

    test("rejects invalid duration", () => {
      const result = validatePlanInput({
        name: "Annual",
        durationDays: -5,
        price: 199.99,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Duration");
    });

    test("rejects negative price", () => {
      const result = validatePlanInput({
        name: "Day Pass",
        durationDays: 1,
        price: -10,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Price");
    });
  });

  describe("isAuthorizedForPlanMutation", () => {
    test("allows admin role", () => {
      expect(isAuthorizedForPlanMutation("admin")).toBe(true);
    });

    test("allows staff role", () => {
      expect(isAuthorizedForPlanMutation("staff")).toBe(true);
    });

    test("blocks member role", () => {
      expect(isAuthorizedForPlanMutation("member")).toBe(false);
    });

    test("blocks null/undefined role", () => {
      expect(isAuthorizedForPlanMutation(null)).toBe(false);
      expect(isAuthorizedForPlanMutation(undefined)).toBe(false);
    });
  });
});
