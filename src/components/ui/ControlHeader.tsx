import Image from "next/image";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";
import ProfileButton from "./ProfileButton";

type Props = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  };
};

function ControlHeader({ user }: Props) {
  const isSupervisor = user.role === "supervisor";
  const isAdmin = user.role === "admin";
  
  const glowClass = isSupervisor ? "control-header-glow-supervisor" : isAdmin ? "control-header-glow-admin" : "";

  return (
    <header
      className={`bg-popover relative flex h-20 sm:h-24 w-full items-center justify-between px-2 sm:px-3 md:px-8 border-b gap-2 ${glowClass}`}
    >
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
        <ProfileButton user={user} />
        <DarkModeToggle />
      </div>
    </header>
  );
}

export default ControlHeader;

