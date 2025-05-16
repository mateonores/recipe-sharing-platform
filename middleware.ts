import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = [
  "/profile",
  "/profile/recipes",
  "/profile/favorites",
  "/recipes/create",
];

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client for use in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll: (cookies) => {
          for (const cookie of cookies) {
            res.cookies.set({
              name: cookie.name,
              value: cookie.value,
              ...cookie.options,
            });
          }
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getSession();

  // Check if route requires authentication
  const { pathname } = request.nextUrl;

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    // Get the user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If user is not authenticated, redirect to login
    if (!session) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If user is logged in and tries to access login/signup pages, redirect to home
  if (["/login", "/signup"].includes(pathname)) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
