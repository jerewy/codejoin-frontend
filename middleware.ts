import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options })
          );
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  // Handle OAuth callback - let Supabase process it first
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // If this is an OAuth callback, let Supabase handle it before proceeding
  if (code || error) {
    // Process the OAuth callback
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
    // Just ensure cookies are properly handled
    return supabaseResponse;
  }

  // IMPORTANT: DO NOT remove auth.refreshSession()
  // This will refresh the user's session and ensure they have the latest auth state
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Optionally, you can protect routes based on auth state
  // For API routes, let the individual routes handle auth checks
  // This middleware just ensures the session is refreshed and cookies are properly handled

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
