import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const isAuthRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/sign-up";

  if (isAuthRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(
        new URL("/notes", process.env.NEXT_PUBLIC_BASE_URL || request.url),
      );
    }
  }

  const { searchParams, pathname } = new URL(request.url);

  if (!searchParams.get("noteId") && pathname === "/notes") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // Use the request URL to determine base URL (works in all environments)
        const requestUrl = new URL(request.url);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${requestUrl.protocol}//${requestUrl.host}`;
        const cookieHeader = request.headers.get('cookie') || '';
        
        // Try to fetch the newest note first
        const fetchResponse = await fetch(`${baseUrl}/api/fetch-newest-note?userId=${user.id}`, {
          headers: { 'Cookie': cookieHeader },
        });
        
        if (fetchResponse.ok) {
          const { newestNoteId } = await fetchResponse.json();
          if (newestNoteId) {
            const url = request.nextUrl.clone();
            url.searchParams.set("noteId", newestNoteId);
            return NextResponse.redirect(url);
          }
        }

        // If no note exists, create a new one
        const createResponse = await fetch(`${baseUrl}/api/create-new-note?userId=${user.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", 'Cookie': cookieHeader },
        });

        if (createResponse.ok) {
          const { noteId } = await createResponse.json();
          if (noteId) {
            const url = request.nextUrl.clone();
            url.searchParams.set("noteId", noteId);
            return NextResponse.redirect(url);
          }
        }
      } catch (error) {
        // Log error in production for debugging, but don't block the request
        console.error("Error in middleware note selection:", error);
      }
    }
  }

  return supabaseResponse;
}