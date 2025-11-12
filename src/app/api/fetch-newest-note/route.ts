import { prisma } from "@/db/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/auth/server";
import { isValidUUID } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId") || "";
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Invalid userId", newestNoteId: null }, { status: 400 });
    }

    const { auth } = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await auth.getUser();
    if (authError || !supabaseUser || supabaseUser.id !== userId) {
      return NextResponse.json({ error: "Unauthorized", newestNoteId: null }, { status: 401 });
    }

    const newestNote = await prisma.note.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    return NextResponse.json({ newestNoteId: newestNote?.id || null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch newest note", newestNoteId: null }, { status: 500 });
  }
}