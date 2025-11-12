import { prisma } from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";
import { isValidUUID } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId") || "";
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid userId", noteId: null }, { status: 400 });
    }

    const { auth } = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await auth.getUser();
    if (authError || !supabaseUser || supabaseUser.id !== userId) {
      return NextResponse.json({ error: "Unauthorized", noteId: null }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      try {
        user = await prisma.user.create({ data: { id: userId, email: supabaseUser.email || "" } });
      } catch (dbError: unknown) {
        if ((dbError as { code?: string })?.code === 'P2002') {
          user = await prisma.user.findUnique({ where: { id: userId } });
        }
        if (!user) throw new Error("Failed to create user");
      }
    }

    const { id } = await prisma.note.create({
      data: { authorId: userId, text: "", title: "No title" },
    });

    return NextResponse.json({ noteId: id });
  } catch {
    return NextResponse.json({ error: "Failed to create note", noteId: null }, { status: 500 });
  }
}