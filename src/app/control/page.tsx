import { getUser } from "@/auth/server";
import { getAllUsersAction } from "@/actions/users";
import { getAllSupportTicketsAction, getTicketStatsAction } from "@/actions/support";
import { prisma } from "@/db/prisma";
import { redirect } from "next/navigation";
import ControlPageClient from "@/components/ui/ControlPageClient";
import ControlHeader from "@/components/ui/ControlHeader";

async function ControlPage() {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get user profile data first (needed for role check)
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      blocked: true,
    },
  });

  if (!userProfile) {
    redirect("/login");
  }

  if (userProfile.blocked) {
    redirect("/blocked");
  }

  if (userProfile.role !== "admin" && userProfile.role !== "supervisor") {
    redirect("/notes");
  }

  // Parallelize data fetching for better performance
  const [usersResult, ticketsResult, statsResult] = await Promise.all([
    getAllUsersAction(),
    getAllSupportTicketsAction(),
    getTicketStatsAction(),
  ]);

  const users = usersResult.users || [];
  const tickets = ticketsResult.tickets || [];
  const stats = statsResult.stats || [];

  return (
    <>
      <ControlHeader user={userProfile} />
      <main className="flex flex-1 flex-col px-2 sm:px-4 pt-6 sm:pt-10 xl:px-8">
        <ControlPageClient
          users={users as any}
          tickets={tickets as any}
          stats={stats as any}
          userRole={userProfile.role || "user"}
          currentUserId={user.id}
        />
      </main>
    </>
  );
}

export default ControlPage;

