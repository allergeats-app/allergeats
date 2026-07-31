import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // Supabase sometimes redirects OAuth code to / instead of /auth/callback
  if (pathname === "/" && searchParams.get("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Block admin sub-routes at the edge — redirect to login if session cookie absent
  if (pathname.startsWith("/admin/")) {
    const session = request.cookies.get("allegeats_admin_session");
    if (!session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path+"],
};
