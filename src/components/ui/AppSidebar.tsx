import { getUser } from "@/auth/server";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { prisma } from "@/db/prisma";
import { Note } from "@prisma/client";
import Link from "next/link";
import SidebarGroupContent from "./SidebarGroupContent";
import ReviewButton from "./ReviewButton";
import SupportButton from "./SupportButton";

async function AppSidebar() {
  const user = await getUser();

  let notes: Note[] = [];

  if (user) {
    try {
      notes = await prisma.note.findMany({
        where: {
          OR: [
            { authorId: user.id },
            { collaborators: { some: { id: user.id } } },
          ],
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } catch (error) {
      console.error("AppSidebar: Database error loading notes:", error);
    }
  }

  return (
    <Sidebar className="border-r">
      <SidebarContent className="custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 mt-2 text-lg">
            {user ? (
              "Your Notes"
            ) : (
              <p>
                <Link href="/login" className="underline">
                  Login
                </Link>{" "}
                to see your notes
              </p>
            )}
          </SidebarGroupLabel>
          {user && (
            <SidebarGroupContent notes={notes} />
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SupportButton />
        <ReviewButton />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;