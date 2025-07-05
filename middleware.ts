import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const locales = ["en", "ps"];
const defaultLocale = "en";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the pathname has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Define protected routes (routes that require authentication)
    const isProtectedRoute =
      pathname.includes("/members") ||
      pathname.includes("/events") ||
      pathname.includes("/payments") ||
      pathname.includes("/reports") ||
      pathname.includes("/test");

    // Define auth routes (login, register, etc.)
    const isAuthRoute =
      pathname.includes("/login") ||
      pathname.includes("/register") ||
      pathname.includes("/auth");

    // Only check auth for protected routes or auth routes
    if (isProtectedRoute || isAuthRoute) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If user is not authenticated and trying to access protected route
      if (!user && isProtectedRoute) {
        const locale = pathname.split("/")[1];
        const loginUrl = new URL(`/${locale}/login`, request.url);
        return NextResponse.redirect(loginUrl);
      }

      // If user is authenticated and trying to access auth routes
      if (user && isAuthRoute) {
        const locale = pathname.split("/")[1];
        const homeUrl = new URL(`/${locale}`, request.url);
        return NextResponse.redirect(homeUrl);
      }
    }

    // Add cache headers for better performance
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600"
    );
    return response;
  }

  // Redirect if there is no locale
  const locale = defaultLocale;
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files with extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
