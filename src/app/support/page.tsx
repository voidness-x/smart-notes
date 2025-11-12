import { getUser } from "@/auth/server";
import { getMySupportTicketsAction } from "@/actions/support";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import SupportPageClient from "@/components/ui/SupportPageClient";

async function SupportPage() {
  const user = await getUser();

  // Check if user is blocked - redirect to blocked page
  // Blocked users cannot access support (they can contact via email if needed)
  if (user) {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { blocked: true },
    });

    if (userData?.blocked) {
      redirect("/blocked");
    }
  }

  // Get user profile if logged in
  let userProfile = null;
  if (user) {
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!profile && user.email) {
      try {
        profile = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });
      } catch (error: any) {
        if (error?.code === 'P2002') {
          profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });
        }
      }
    }
    userProfile = profile;
  }

  // Get user's tickets if logged in
  let tickets = [];
  if (user) {
    const ticketsResult = await getMySupportTicketsAction();
    tickets = ticketsResult.tickets || [];
  }

  return (
    <SupportPageClient
      user={userProfile}
      tickets={tickets as any}
    />
  );
}

export default SupportPage;

