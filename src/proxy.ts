import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthRedirect } from "@/lib/auth-guard";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const redirectUrl = getAuthRedirect(pathname, session?.user ?? null);
  if (redirectUrl) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
