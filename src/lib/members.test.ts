import { describe, expect, test } from "bun:test";
import {
  validateMemberInput,
  generateMemberCode,
  isAuthorizedForMemberManagement,
  filterMembers,
  MemberRecord,
} from "./members";

describe("Member Directory & Profile Management Unit Tests", () => {
  describe("validateMemberInput", () => {
    test("validates valid member input with full name, email, and phone number", () => {
      const result = validateMemberInput({
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phoneNumber: "+1234567890",
      });
    });

    test("validates input with missing or null phone number", () => {
      const result = validateMemberInput({
        name: "Jane Smith",
        email: "jane@example.com",
      });

      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phoneNumber: null,
      });
    });

    test("rejects empty or missing name", () => {
      const res1 = validateMemberInput({ email: "test@example.com" });
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("Name is required");

      const res2 = validateMemberInput({ name: "   ", email: "test@example.com" });
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain("Name is required");
    });

    test("rejects invalid or missing email", () => {
      const res1 = validateMemberInput({ name: "John Doe" });
      expect(res1.valid).toBe(false);
      expect(res1.error).toContain("Email is required");

      const res2 = validateMemberInput({ name: "John Doe", email: "invalid-email" });
      expect(res2.valid).toBe(false);
      expect(res2.error).toContain("Invalid email");
    });
  });

  describe("generateMemberCode", () => {
    test("starts at GYM-1001 when no existing codes", () => {
      const code = generateMemberCode([]);
      expect(code).toBe("GYM-1001");
    });

    test("increments from highest GYM-XXXX code", () => {
      const existing = ["GYM-1001", "GYM-1002", "GYM-1005"];
      const code = generateMemberCode(existing);
      expect(code).toBe("GYM-1006");
    });

    test("handles non-standard or dirty codes gracefully", () => {
      const existing = ["GYM-1001", "INVALID", "GYM-abc", "GYM-1010"];
      const code = generateMemberCode(existing);
      expect(code).toBe("GYM-1011");
    });
  });

  describe("isAuthorizedForMemberManagement", () => {
    test("allows admin and staff roles", () => {
      expect(isAuthorizedForMemberManagement("admin")).toBe(true);
      expect(isAuthorizedForMemberManagement("staff")).toBe(true);
    });

    test("denies member role or null/undefined", () => {
      expect(isAuthorizedForMemberManagement("member")).toBe(false);
      expect(isAuthorizedForMemberManagement(null)).toBe(false);
      expect(isAuthorizedForMemberManagement(undefined)).toBe(false);
      expect(isAuthorizedForMemberManagement("guest")).toBe(false);
    });
  });

  describe("filterMembers", () => {
    const mockMembers: MemberRecord[] = [
      {
        id: "1",
        name: "Alice Johnson",
        email: "alice@gym.com",
        memberCode: "GYM-1001",
        phoneNumber: "555-0101",
        role: "member",
        createdAt: new Date(),
      },
      {
        id: "2",
        name: "Bob Smith",
        email: "bob@other.com",
        memberCode: "GYM-1002",
        phoneNumber: "555-0102",
        role: "member",
        createdAt: new Date(),
      },
      {
        id: "3",
        name: "Charlie Brown",
        email: "charlie@gym.com",
        memberCode: "GYM-1003",
        phoneNumber: "555-0103",
        role: "member",
        createdAt: new Date(),
      },
    ];

    test("returns all members on empty query", () => {
      expect(filterMembers(mockMembers, "")).toHaveLength(3);
    });

    test("filters by name", () => {
      const result = filterMembers(mockMembers, "Alice");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice Johnson");
    });

    test("filters by email", () => {
      const result = filterMembers(mockMembers, "other.com");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Bob Smith");
    });

    test("filters by memberCode case-insensitively", () => {
      const result = filterMembers(mockMembers, "gym-1003");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Charlie Brown");
    });
  });
});
