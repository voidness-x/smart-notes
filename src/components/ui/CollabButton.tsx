"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Users, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  toggleCollaborationAction,
  createInviteLinkAction,
  sendInviteByUserIdAction,
} from "@/actions/collaboration";
import { useSearchParams, useRouter } from "next/navigation";

type Props = {
  noteId: string;
  isCollaborative: boolean;
};

function CollabButton({ noteId, isCollaborative }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [userIdInput, setUserIdInput] = useState("");
  const [activeTab, setActiveTab] = useState<"link" | "userId">("link");

  // Handle invite token from URL
  useEffect(() => {
    const inviteToken = searchParams.get("invite");
    if (inviteToken && noteId) {
      // This will be handled by the notes page
      router.replace(`/notes?noteId=${noteId}`);
    }
  }, [searchParams, noteId, router]);

  const handleToggleCollaboration = async () => {
    setIsToggling(true);
    const result = await toggleCollaborationAction(noteId, !isCollaborative);
    setIsToggling(false);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", {
        description: isCollaborative
          ? "Collaboration disabled"
          : "Collaboration enabled",
      });
      router.refresh();
    }
  };

  const handleCreateInviteLink = async () => {
    setIsCreatingLink(true);
    const result = await createInviteLinkAction(noteId);
    setIsCreatingLink(false);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else if (!result.errorMessage && 'inviteLink' in result && result.inviteLink) {
      setInviteLink(result.inviteLink);
      toast.success("Success", { description: "Invite link created" });
    }
  };

  const handleSendInviteByUserId = async () => {
    if (!userIdInput.trim()) {
      toast.error("Error", { description: "Please enter a user ID" });
      return;
    }

    setIsSendingInvite(true);
    const result = await sendInviteByUserIdAction(noteId, userIdInput.trim());
    setIsSendingInvite(false);

    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
    } else {
      toast.success("Success", { description: "Invite sent successfully" });
      setUserIdInput("");
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Copied", { description: "Invite link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Error", { description: "Failed to copy link" });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setInviteLink("");
      setUserIdInput("");
      setActiveTab("link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2 border rounded-md p-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleCollaboration}
          disabled={isToggling}
          className="flex items-center gap-2"
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          Collab
        </Button>
        {isCollaborative && (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Invite
            </Button>
          </DialogTrigger>
        )}
      </div>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
          <DialogDescription>
            Share this note with others to collaborate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "link"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Invite Link
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("userId")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "userId"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Send by User ID
            </button>
          </div>

          {/* Invite Link Tab */}
          {activeTab === "link" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>One-time use invite link</Label>
                <p className="text-xs text-muted-foreground">
                  Generate a link that can be used once to join this note
                </p>
              </div>

              {inviteLink ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Link expires in 7 days
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateInviteLink}
                  disabled={isCreatingLink}
                  className="w-full"
                >
                  {isCreatingLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Generate Invite Link"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* User ID Tab */}
          {activeTab === "userId" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <p className="text-xs text-muted-foreground">
                  Enter the user ID of the person you want to invite
                </p>
                <Input
                  id="userId"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="Enter user ID..."
                  className="font-mono text-xs"
                />
              </div>

              <Button
                type="button"
                onClick={handleSendInviteByUserId}
                disabled={isSendingInvite || !userIdInput.trim()}
                className="w-full"
              >
                {isSendingInvite ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invite"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CollabButton;

