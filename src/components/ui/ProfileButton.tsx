"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import ProfileDialog from "./ProfileDialog";
import { getPendingInvitesAction } from "@/actions/collaboration";

type Props = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
  } | null;
};

function ProfileButton({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const router = useRouter();

  // Load pending invites count
  useEffect(() => {
    if (!user) return;
    const loadInvitesCount = async () => {
      const result = await getPendingInvitesAction();
      if (!result.errorMessage && result.invites) {
        setPendingInvitesCount(result.invites.length);
      }
    };

    loadInvitesCount();
    // Refresh when dialog opens/closes
    if (open) {
      loadInvitesCount();
    }
  }, [open, user]);
  
  if (!user) return null;

  // Get initials from email for fallback
  const getInitials = (email: string) => {
    const parts = email.split("@")[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 1).toUpperCase();
  };

  // Get display name: use name if available, otherwise use email prefix
  const displayName = user.name || user.email.split("@")[0];

  const isSupervisor = user.role === "supervisor";
  const isAdmin = user.role === "admin";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1 sm:gap-2">
        {(isSupervisor || isAdmin) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/control");
            }}
            className={`text-[10px] sm:text-xs font-semibold cursor-pointer hover:underline ${
              isSupervisor ? "text-green-500" : "text-red-500"
            }`}
          >
            {isSupervisor ? "supervisor" : "admin"}
          </button>
        )}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
              onClick={() => setOpen(true)}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
                  {getInitials(user.email)}
                </div>
              )}
            </Button>
            {/* Red dot notification for pending invites */}
            {pendingInvitesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                <span className="text-[8px] sm:text-[10px] font-bold text-white">
                  {pendingInvitesCount > 9 ? "9+" : pendingInvitesCount}
                </span>
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-foreground/80 max-w-[60px] sm:max-w-[80px] truncate hidden sm:block">
            {displayName}
          </span>
        </div>
      </div>
      <DialogContent className="sm:max-w-md max-w-[95vw] mx-4">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <ProfileDialog user={user} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default ProfileButton;

