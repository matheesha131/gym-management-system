import { describe, test, expect } from "bun:test";
import { getAuthRedirect, UserRole } from "./auth-guard";

describe("Auth Guard Route Rules", () => {
  test("unauthenticated user accessing /admin/dashboard redirects to /login", () => {
    const redirect = getAuthRedirect("/admin/dashboard", null);
    expect(redirect).toBe("/login");
  });

  test("unauthenticated user accessing /portal/profile redirects to /login", () => {
    const redirect = getAuthRedirect("/portal/profile", null);
    expect(redirect).toBe("/login");
  });

  test("unauthenticated user accessing public route / allows access", () => {
    const redirect = getAuthRedirect("/", null);
    expect(redirect).toBeNull();
  });

  test("unauthenticated user accessing /login allows access", () => {
    const redirect = getAuthRedirect("/login", null);
    expect(redirect).toBeNull();
  });

  test("member accessing /admin/users redirects to /portal", () => {
    const redirect = getAuthRedirect("/admin/users", { role: "member" });
    expect(redirect).toBe("/portal");
  });

  test("admin accessing /admin/users is allowed", () => {
    const redirect = getAuthRedirect("/admin/users", { role: "admin" });
    expect(redirect).toBeNull();
  });

  test("staff accessing /admin/users is allowed", () => {
    const redirect = getAuthRedirect("/admin/users", { role: "staff" });
    expect(redirect).toBeNull();
  });

  test("admin accessing /portal/dashboard redirects to /admin", () => {
    const redirect = getAuthRedirect("/portal/dashboard", { role: "admin" });
    expect(redirect).toBe("/admin");
  });

  test("staff accessing /portal/dashboard redirects to /admin", () => {
    const redirect = getAuthRedirect("/portal/dashboard", { role: "staff" });
    expect(redirect).toBe("/admin");
  });

  test("member accessing /portal/dashboard is allowed", () => {
    const redirect = getAuthRedirect("/portal/dashboard", { role: "member" });
    expect(redirect).toBeNull();
  });

  test("authenticated admin accessing /login redirects to /admin", () => {
    const redirect = getAuthRedirect("/login", { role: "admin" });
    expect(redirect).toBe("/admin");
  });

  test("authenticated member accessing /login redirects to /portal", () => {
    const redirect = getAuthRedirect("/login", { role: "member" });
    expect(redirect).toBe("/portal");
  });
});
