export type UserRole = "admin" | "staff" | "member" | string;

export interface SessionUser {
  id?: string;
  role?: UserRole | null;
  email?: string;
  name?: string;
}

export function getAuthRedirect(
  pathname: string,
  user: SessionUser | null
): string | null {
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isAdminRoute = pathname.startsWith("/admin");
  const isPortalRoute = pathname.startsWith("/portal");

  if (!user) {
    if (isAdminRoute || isPortalRoute) {
      return "/login";
    }
    return null;
  }

  const role = user.role || "member";
  const isAdminOrStaff = role === "admin" || role === "staff";

  if (isAuthRoute) {
    return isAdminOrStaff ? "/admin" : "/portal";
  }

  if (isAdminRoute && !isAdminOrStaff) {
    return "/portal";
  }

  if (isPortalRoute && isAdminOrStaff) {
    return "/admin";
  }

  return null;
}
