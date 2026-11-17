import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// A URL/key counts as "configured" only when present and not a placeholder.
function isConfigured(url?: string, key?: string): url is string {
  return (
    !!url &&
    !!key &&
    url.startsWith("http") &&
    !url.includes("your-project-ref")
  );
}

// Refreshes the Supabase auth session cookie on every request and
// guards /admin and /account routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Not configured yet → don't throw. Let public pages render; admin/account
  // pages will show the "connect Supabase" state from their own guards.
  if (!isConfigured(url, anonKey)) {
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protect /admin (except the login page)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_admin");
      return NextResponse.redirect(url);
    }
  }

  // Protect /account (customer dashboard)
  if (path.startsWith("/account") && !path.startsWith("/account/auth")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/account/auth/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  return response;
}
