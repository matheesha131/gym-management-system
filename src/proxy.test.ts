import { describe, test, expect, mock } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("Proxy Middleware", () => {
  test("redirects unauthenticated request to /admin/users to /login", async () => {
    const req = new NextRequest("http://localhost:3000/admin/users");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  test("redirects unauthenticated request to /portal/dashboard to /login", async () => {
    const req = new NextRequest("http://localhost:3000/portal/dashboard");
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  test("allows unauthenticated request to /", async () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = await proxy(req);
    // NextResponse.next() returns a 200 response with x-middleware-next header
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  test("allows unauthenticated request to /login", async () => {
    const req = new NextRequest("http://localhost:3000/login");
    const res = await proxy(req);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
