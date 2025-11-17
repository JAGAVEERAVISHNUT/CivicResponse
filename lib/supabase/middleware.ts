import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up", "/auth/sign-up-success"];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  if (user && (request.nextUrl.pathname === "/auth/login" || request.nextUrl.pathname === "/auth/sign-up")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    
    if (profile?.role === 'admin') {
      url.pathname = "/admin";
    } else if (profile?.role === 'l2_officer') {
      url.pathname = "/l2-dashboard";
    } else if (profile?.role === 'l1_officer') {
      url.pathname = "/l1-dashboard";
    } else {
      url.pathname = "/citizen";
    }
    
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
