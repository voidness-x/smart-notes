import { getUser } from "@/auth/server";
import { getMySupportTicketsAction } from "@/actions/support";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import SupportPageClient from "@/components/ui/SupportPageClient";

async function SupportPage() {
  const user = await getUser();

  // Parallelize all queries for better performance
  const [userData, profile, ticketsResult] = await Promise.all([
    // Check if user is blocked
    user ? prisma.user.findUnique({
      where: { id: user.id },
      select: { blocked: true },
    }) : Promise.resolve(null),
    
    // Get user profile
    user ? prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    }) : Promise.resolve(null),
    
    // Get user's tickets
    user ? getMySupportTicketsAction() : Promise.resolve({ errorMessage: null, tickets: [] }),
  ]);

  // Check if user is blocked - redirect to blocked page
  if (userData?.blocked) {
    redirect("/blocked");
  }

  let userProfile: { id: string; email: string; name: string | null } | null = profile;

  // If user doesn't exist in database but is authenticated, create them
  if (user && !userProfile && user.email) {
    try {
      userProfile = await prisma.user.create({
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
        userProfile = await prisma.user.findUnique({
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

  const tickets = ticketsResult.tickets || [];

  return (
    <SupportPageClient
      user={userProfile}
      tickets={tickets as any}
    />
  );
}

export default SupportPage;

