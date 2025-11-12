import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import ProfileButton from "@/components/ui/ProfileButton";
import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { SidebarTrigger } from "./sidebar";

async function Header() {
  const user = await getUser();
  
  // Get user profile data if logged in
  let userProfile = null;
  if (user) {
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    // If user doesn't exist in database but is authenticated, create them
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
            avatarUrl: true,
            role: true,
          },
        });
      } catch (error: any) {
        // If user was created by another request (race condition), fetch it
        if (error?.code === 'P2002') {
          profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          });
        }
      }
    }

    userProfile = profile as { id: string; email: string; name?: string | null; avatarUrl?: string | null; role?: string | null } | null;
  }

  return (
    <header className="bg-popover header-shadow relative flex h-20 sm:h-24 w-full items-center justify-between px-2 sm:px-3 md:px-8 border-b gap-2">
      <SidebarTrigger className="absolute left-1 top-1 shrink-0"/>
      
        <Link className="flex items-end gap-1 sm:gap-2 min-w-0" href={"/"}>
          <Image
            src="/Smart Notes.png"
            height={60}
            width={60}
            alt="Logo"
            className="rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-[60px] md:w-[60px] shrink-0"
            priority
          />

        <h1 className="flex flex-col pb-1 text-lg sm:text-xl md:text-2xl font-semibold leading-5 sm:leading-6 shrink-0">
          SMART <span>NOTES</span>
        </h1>
        </Link>

        <div className="flex gap-2 sm:gap-4 items-center shrink-0">
          {userProfile ? (
            <ProfileButton user={userProfile} />
          ) : (
            <>
              <Button asChild size="sm" className="hidden sm:flex">
                <Link href="/sign-up">
                  Sign Up
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
          <DarkModeToggle/>
        </div>
    </header>
  );
}

export default Header;