"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Loader2, Camera, LogOut, Check, X as XIcon, Mail, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logOutAction, updateAvatarAction, updateUserNameAction, deleteAccountAction } from "@/actions/users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { generateRandomName } from "@/lib/randomName";
import imageCompression from "browser-image-compression";
import {
  getPendingInvitesAction,
  acceptInviteAction,
  rejectInviteAction,
} from "@/actions/collaboration";

type Props = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  onClose: () => void;
};

type Invite = {
  id: string;
  noteId: string;
  sender: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  note: {
    id: string;
    title: string | null;
    text: string;
  };
  createdAt: Date;
};

function ProfileDialog({ user, onClose }: Props) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || null);
  const [name, setName] = useState(user.name || "");
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameUpdateTimeoutRef = useRef<NodeJS.Timeout>();

  // Load pending invites
  useEffect(() => {
    const loadInvites = async () => {
      setLoadingInvites(true);
      const result = await getPendingInvitesAction();
      setLoadingInvites(false);

      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else if (!result.errorMessage && 'invites' in result && result.invites) {
        setInvites(result.invites as Invite[]);
      }
    };

    loadInvites();
  }, []);

  // Get initials from email for fallback
  const getInitials = (email: string) => {
    const parts = email.split("@")[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 1).toUpperCase();
  };

  const handleAcceptInvite = async (inviteId: string, noteId: string) => {
    setProcessingInvite(inviteId);
    const result = await acceptInviteAction(inviteId);
    setProcessingInvite(null);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: "Invite accepted" });
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
      router.push(`/notes?noteId=${noteId}`);
      router.refresh();
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    setProcessingInvite(inviteId);
    const result = await rejectInviteAction(inviteId);
    setProcessingInvite(null);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: "Invite rejected" });
      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Error", { description: "Please select an image file" });
      return;
    }

    setUploading(true);

    try {
      // Compress image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.8,
      };

      const compressedFile = await imageCompression(file, options);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        
        // Update avatar
        const result = await updateAvatarAction(base64Image);
        
        if (result.errorMessage) {
          toast.error("Error", { description: result.errorMessage });
        } else {
          setAvatarUrl(base64Image);
          toast.success("Success", { description: "Profile picture updated" });
        }
        
        setUploading(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Error", { description: "Failed to upload profile picture" });
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogOut = async () => {
    setLoggingOut(true);
    // Redirect to logout page which will handle the logout action
    router.push("/logout");
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error("Error", { description: "Please enter your password" });
      return;
    }

    setDeletingAccount(true);
    try {
      const result = await deleteAccountAction(deletePassword);
      
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
        setDeletingAccount(false);
        setDeletePassword("");
      } else if (result.success) {
        toast.success("Success", { description: "Account deleted successfully" });
        setDeleteDialogOpen(false);
        setDeletePassword("");
        // Wait a moment for the toast to show, then redirect to login
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error", { description: "Failed to delete account. Please try again." });
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold border-2 border-border">
              {getInitials(user.email)}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <p className="text-sm text-muted-foreground">Click camera icon to change</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              // Debounced save
              clearTimeout(nameUpdateTimeoutRef.current);
              nameUpdateTimeoutRef.current = setTimeout(async () => {
                const newName = e.target.value.trim();
                if (newName === "") {
                  // Generate random name if empty
                  const randomName = generateRandomName();
                  setSavingName(true);
                  const result = await updateUserNameAction(randomName);
                  if (result.errorMessage) {
                    toast.error("Error", { description: result.errorMessage });
                  } else {
                    setName(randomName);
                    toast.success("Success", { description: "Random name generated" });
                  }
                  setSavingName(false);
                } else {
                  setSavingName(true);
                  const result = await updateUserNameAction(newName);
                  if (result.errorMessage) {
                    toast.error("Error", { description: result.errorMessage });
                  } else {
                    toast.success("Success", { description: "Name updated" });
                  }
                  setSavingName(false);
                }
              }, 1000);
            }}
            placeholder="Enter your name or leave empty for random"
            className="flex-1"
            disabled={savingName}
          />
          {savingName && (
            <Loader2 className="h-4 w-4 animate-spin self-center text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty to generate a random name
        </p>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
      </div>

      {/* User ID */}
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <div className="flex gap-2">
          <Input
            id="userId"
            type="text"
            value={user.id}
            disabled
            className="bg-muted font-mono text-xs flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(user.id);
                toast.success("Success", { description: "User ID copied to clipboard" });
              } catch (err) {
                toast.error("Error", { description: "Failed to copy user ID" });
              }
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This is your unique account identifier
        </p>
      </div>

      {/* Inbox Section */}
      <div className="pt-4 border-t space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <Label className="text-base font-semibold">Inbox</Label>
          {invites.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {invites.length}
            </span>
          )}
        </div>

        {loadingInvites ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending invites
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {invites.map((invite) => {
              const senderName = invite.sender.name || invite.sender.email.split("@")[0];
              const noteTitle = invite.note.title || "Untitled Note";

              return (
                <div
                  key={invite.id}
                  className="border rounded-lg p-3 space-y-2 bg-muted/50"
                >
                  <div className="flex items-start gap-2">
                    {invite.sender.avatarUrl ? (
                      <img
                        src={invite.sender.avatarUrl}
                        alt={senderName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {getInitials(invite.sender.email)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{senderName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        wants to collaborate on "{noteTitle}"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                      onClick={() => handleAcceptInvite(invite.id, invite.noteId)}
                      disabled={processingInvite === invite.id}
                    >
                      {processingInvite === invite.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                      onClick={() => handleRejectInvite(invite.id)}
                      disabled={processingInvite === invite.id}
                    >
                      {processingInvite === invite.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <XIcon className="h-3 w-3 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="pt-4 border-t space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogOut}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </>
          )}
        </Button>

        {/* Delete Account Button */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={deletingAccount}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account, all your notes, reviews, and all associated data. Please enter your password to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  disabled={deletingAccount}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && deletePassword.trim() && !deletingAccount) {
                      handleDeleteAccount();
                    }
                  }}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingAccount} onClick={() => setDeletePassword("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={!deletePassword.trim() || deletingAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default ProfileDialog;

