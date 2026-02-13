import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/db/prisma";

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

  // Auth check — single call, reused for all checks below
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect logged-in users away from auth pages
  const isAuthRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/sign-up";

  if (isAuthRoute && user) {
    return NextResponse.redirect(
      new URL("/notes", process.env.NEXT_PUBLIC_BASE_URL || request.url),
    );
  }

  // For /notes routes: check blocked status & auto-select latest note
  if (request.nextUrl.pathname === "/notes" && user) {
    try {
      // Check if user is blocked (moved from layout to avoid per-render DB call)
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { blocked: true },
      });

      if (userData?.blocked) {
        return NextResponse.redirect(new URL("/blocked", request.url));
      }

      // Auto-select the latest note if no noteId is provided
      if (!request.nextUrl.searchParams.get("noteId")) {
        const newestNote = await prisma.note.findFirst({
          where: {
            OR: [
              { authorId: user.id },
              { collaborators: { some: { id: user.id } } },
            ],
          },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });

        if (newestNote) {
          const url = request.nextUrl.clone();
          url.searchParams.set("noteId", newestNote.id);
          return NextResponse.redirect(url);
        }
        // If no notes exist, let the page handle it (no redirect)
      }
    } catch (error) {
      console.error("Middleware error:", error);
      // Continue to page on error — don't block the user
    }
  }

  return supabaseResponse;
}