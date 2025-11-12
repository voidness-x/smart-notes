"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { assignTicketAction, updateTicketStatusAction } from "@/actions/support";
import { promoteToAdminAction, demoteFromAdminAction, blockUserAction, unblockUserAction } from "@/actions/users";
import { toast } from "sonner";
import { Loader2, ChevronDown, ChevronUp, Calendar, Clock, Users, Ticket, Search, ExternalLink } from "lucide-react";
import { Input } from "./input";

type Props = {
  users: Array<{
    id: string;
    email: string;
    name?: string | null;
    createdAt: Date;
    lastActiveAt?: Date | null;
    role: string;
    blocked?: boolean;
  }>;
  tickets: Array<{
    id: string;
    userId: string;
    email: string;
    title: string;
    description: string;
    photoUrl?: string | null;
    status: string;
    solution?: string | null;
    createdAt: Date;
    handledById?: string | null;
    handledBy?: {
      id: string;
      name?: string | null;
      email: string;
    } | null;
    user?: {
      id: string;
      name?: string | null;
      email: string;
    } | null;
  }>;
  stats: Array<{
    handler: {
      id: string;
      name?: string | null;
      email: string;
    } | null;
    count: number;
  }>;
  userRole: string;
  currentUserId: string;
};

function ControlPageClient({ users, tickets, stats, userRole, currentUserId }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"users" | "tickets">("users");
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [unhandledOpen, setUnhandledOpen] = useState(true);
  const [handledOpen, setHandledOpen] = useState(false);
  const [processingTicket, setProcessingTicket] = useState<string | null>(null);
  const [promotingUser, setPromotingUser] = useState<string | null>(null);
  const [demotingUser, setDemotingUser] = useState<string | null>(null);
  const [blockingUser, setBlockingUser] = useState<string | null>(null);
  const [solutionDialogOpen, setSolutionDialogOpen] = useState<Record<string, boolean>>({});
  const [solutionText, setSolutionText] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");

  const isSupervisor = userRole === "supervisor";

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!userSearch.trim()) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  // Filter tickets based on search
  const filteredUnhandledTickets = tickets.filter(t => {
    if (t.status === "complete") return false;
    if (!ticketSearch.trim()) return true;
    const searchLower = ticketSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(searchLower) ||
      t.email.toLowerCase().includes(searchLower) ||
      t.user?.email.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower)
    );
  });

  const filteredHandledTickets = tickets.filter(t => {
    if (t.status !== "complete") return false;
    if (!ticketSearch.trim()) return true;
    const searchLower = ticketSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(searchLower) ||
      t.email.toLowerCase().includes(searchLower) ||
      t.user?.email.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower)
    );
  });

  const unhandledTickets = filteredUnhandledTickets;
  const handledTickets = filteredHandledTickets;

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Get tickets for a specific user
  const getUserTickets = (userId: string) => {
    return tickets.filter(ticket => ticket.userId === userId);
  };

  // Navigate to tickets section and scroll to a specific ticket
  const navigateToTicket = (ticketId: string) => {
    // Find the ticket to determine which section it's in
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    // Expand the relevant section
    if (ticket.status === "complete") {
      setHandledOpen(true);
    } else {
      setUnhandledOpen(true);
    }
    
    setActiveSection("tickets");
    
    // Scroll to ticket after a delay to allow section transition
    setTimeout(() => {
      const ticketElement = document.getElementById(`ticket-${ticketId}`);
      if (ticketElement) {
        ticketElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight the ticket briefly
        ticketElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          ticketElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, 600);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "being_processed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    setProcessingTicket(ticketId);
    try {
      const result = await assignTicketAction(ticketId);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "Ticket assigned to you" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to assign ticket" });
    } finally {
      setProcessingTicket(null);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: "sent" | "being_processed" | "complete", solution?: string) => {
    setProcessingTicket(ticketId);
    try {
      const result = await updateTicketStatusAction(ticketId, status, solution);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "Ticket status updated" });
        setSolutionDialogOpen(prev => ({ ...prev, [ticketId]: false }));
        setSolutionText(prev => ({ ...prev, [ticketId]: "" }));
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to update ticket status" });
    } finally {
      setProcessingTicket(null);
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    setPromotingUser(userId);
    try {
      const result = await promoteToAdminAction(userId);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "User promoted to admin" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to promote user" });
    } finally {
      setPromotingUser(null);
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    setDemotingUser(userId);
    try {
      const result = await demoteFromAdminAction(userId);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "User demoted from admin" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to demote user" });
    } finally {
      setDemotingUser(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    setBlockingUser(userId);
    try {
      const result = await blockUserAction(userId);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "User blocked" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to block user" });
    } finally {
      setBlockingUser(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setBlockingUser(userId);
    try {
      const result = await unblockUserAction(userId);
      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "User unblocked" });
        window.location.reload();
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to unblock user" });
    } finally {
      setBlockingUser(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-red-500";
      case "being_processed":
        return "text-yellow-500";
      case "complete":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Sent";
      case "being_processed":
        return "Being Processed";
      case "complete":
        return "Complete";
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-8 pb-4 sm:pb-8 px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold">Control Panel</h1>

      {/* Section Navigation */}
      <div className="flex gap-2 sm:gap-4 border-b overflow-x-auto">
        <Button
          variant={activeSection === "users" ? "default" : "ghost"}
          onClick={() => setActiveSection("users")}
          className="rounded-b-none shrink-0"
          size="sm"
        >
          <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-base">Users</span>
        </Button>
        <Button
          variant={activeSection === "tickets" ? "default" : "ghost"}
          onClick={() => setActiveSection("tickets")}
          className="rounded-b-none shrink-0"
          size="sm"
        >
          <Ticket className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-base">Support Tickets</span>
        </Button>
      </div>

      {/* Content Container */}
      <div className="w-full">
        {/* Users Section */}
        {activeSection === "users" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold">Users</h2>
            
            {/* Search Bar for Users */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email, username, or ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="border rounded-lg p-4" style={{ maxHeight: "calc(100vh - 350px)", overflowY: "auto", scrollbarWidth: "thin" }}>
              <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {userSearch ? "No users found matching your search." : "No users found."}
                </p>
              ) : (
                filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-3 sm:p-4 space-y-2"
              >
                <button
                  onClick={() => toggleUserExpanded(user.id)}
                  className="w-full flex items-center justify-between text-left gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{user.name || user.email.split("@")[0]}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {expandedUsers[user.id] ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </button>

                {expandedUsers[user.id] && (
                  <div className="pt-2 space-y-2 border-t">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="break-words">Sign up: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="break-words">
                        Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                    {user.blocked && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-red-500 font-semibold">
                        <span>⚠️ Blocked</span>
                      </div>
                    )}
                    {/* User Tickets History */}
                    {(() => {
                      const userTickets = getUserTickets(user.id);
                      if (userTickets.length > 0) {
                        return (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                              <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Support Tickets ({userTickets.length})</span>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
                              {userTickets.map((ticket) => (
                                <button
                                  key={ticket.id}
                                  onClick={() => navigateToTicket(ticket.id)}
                                  className="w-full text-left p-2 rounded border bg-muted/50 hover:bg-muted transition-colors space-y-1 group"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm font-medium truncate flex-1">
                                      {ticket.title}
                                    </span>
                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(ticket.status)}`}>
                                      {getStatusLabel(ticket.status)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {isSupervisor && user.id !== currentUserId && user.role !== "supervisor" && (
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-2">
                        {user.role === "admin" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDemoteFromAdmin(user.id)}
                            disabled={demotingUser === user.id}
                            className="text-xs sm:text-sm"
                          >
                            {demotingUser === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                <span className="hidden sm:inline">Demoting...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <span className="whitespace-nowrap">Demote from Admin</span>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePromoteToAdmin(user.id)}
                            disabled={promotingUser === user.id}
                            className="text-xs sm:text-sm"
                          >
                            {promotingUser === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                <span className="hidden sm:inline">Promoting...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <span className="whitespace-nowrap">Promote to Admin</span>
                            )}
                          </Button>
                        )}
                        {user.blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockUser(user.id)}
                            disabled={blockingUser === user.id}
                            className="text-xs sm:text-sm"
                          >
                            {blockingUser === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                <span className="hidden sm:inline">Unblocking...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <span className="whitespace-nowrap">Unblock User</span>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlockUser(user.id)}
                            disabled={blockingUser === user.id}
                            className="text-xs sm:text-sm"
                          >
                            {blockingUser === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                <span className="hidden sm:inline">Blocking...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <span className="whitespace-nowrap">Block User</span>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
                ))
              )}
              </div>
            </div>
          </div>
        )}

        {/* Support Tickets Section */}
        {activeSection === "tickets" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300">
            <h2 className="text-xl sm:text-2xl font-semibold">Support Tickets</h2>
            
            {/* Search Bar for Tickets */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by title or email..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Handled Tickets Record */}
            {stats.length > 0 && (
              <div className="border-2 border-primary/20 rounded-lg p-4 sm:p-6 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm shadow-lg">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Handled Tickets
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    Personal Record
                  </div>
                  <div className="pt-2 space-y-2 border-t border-primary/20">
                    {stats.map((stat, index) => (
                      stat.handler && (
                        <div key={index} className="text-sm sm:text-base">
                          <span className="font-semibold break-words">{stat.handler.name || stat.handler.email}</span>
                          <span className="text-muted-foreground mx-2">—</span>
                          <span className="text-primary font-bold">{stat.count}</span>
                          <span className="text-muted-foreground ml-1">tickets</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tickets Container - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Unhandled Tickets */}
              <div className="flex flex-col border rounded-lg p-4 sm:p-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-sm sm:text-base mb-4 shrink-0"
                  onClick={() => setUnhandledOpen(!unhandledOpen)}
                  size="sm"
                >
                  <span className="truncate">Unhandled Tickets ({unhandledTickets.length})</span>
                  {unhandledOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </Button>
                {unhandledOpen && (
                  <div className="space-y-4">
                  {unhandledTickets.length > 0 ? (
                    unhandledTickets.map((ticket) => (
                      <div
                        id={`ticket-${ticket.id}`}
                        key={ticket.id}
                        className="border rounded-lg p-4 sm:p-6 space-y-4 transition-all bg-card hover:bg-muted/30 shadow-sm"
                      >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-base sm:text-lg break-words mb-2">{ticket.title}</h4>
                        <p className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed">{ticket.description}</p>
                      </div>
                      {ticket.photoUrl && (
                        <div className="mt-4">
                          <img
                            src={ticket.photoUrl}
                            alt="Ticket attachment"
                            className="max-w-full rounded-lg border shadow-sm"
                          />
                        </div>
                      )}
                      {ticket.solution && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                          <p className="text-sm font-semibold text-foreground mb-2">Solution:</p>
                          <p className="text-sm sm:text-base break-words leading-relaxed">{ticket.solution}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">From:</span>
                        <span className="font-medium break-words">{ticket.user?.name || ticket.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Status:</span>
                        <span className={`font-semibold text-sm px-3 py-1 rounded-full ${getStatusBadgeColor(ticket.status)} shrink-0`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </div>
                    </div>
                    {ticket.handledBy && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground break-words">
                          <span className="font-medium">Handled by:</span> {ticket.handledBy.name || ticket.handledBy.email}
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 pt-2 border-t">
                      {!ticket.handledById && (
                        <Button
                          size="sm"
                          onClick={() => handleAssignTicket(ticket.id)}
                          disabled={processingTicket === ticket.id}
                          className="text-xs sm:text-sm"
                        >
                          {processingTicket === ticket.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              <span className="hidden sm:inline">Processing...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            "Take Ticket"
                          )}
                        </Button>
                      )}
                      {ticket.handledById === currentUserId && (
                        <>
                          {ticket.status !== "being_processed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(ticket.id, "being_processed")}
                              disabled={processingTicket === ticket.id}
                              className="text-xs sm:text-sm"
                            >
                              <span className="whitespace-nowrap">Mark as Processing</span>
                            </Button>
                          )}
                          {ticket.status !== "complete" && (
                            <Dialog 
                              open={solutionDialogOpen[ticket.id] || false}
                              onOpenChange={(open) => setSolutionDialogOpen(prev => ({ ...prev, [ticket.id]: open }))}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={processingTicket === ticket.id}
                                  className="text-xs sm:text-sm"
                                >
                                  <span className="whitespace-nowrap">Mark as Complete</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-md mx-4">
                                <DialogHeader>
                                  <DialogTitle>Complete Ticket</DialogTitle>
                                  <DialogDescription>
                                    Provide a solution or explanation for the user
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Enter the solution or explanation for the user..."
                                    value={solutionText[ticket.id] || ""}
                                    onChange={(e) => setSolutionText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                    className="min-h-32"
                                  />
                                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSolutionDialogOpen(prev => ({ ...prev, [ticket.id]: false }));
                                        setSolutionText(prev => ({ ...prev, [ticket.id]: "" }));
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateStatus(ticket.id, "complete", solutionText[ticket.id] || undefined)}
                                      disabled={processingTicket === ticket.id}
                                    >
                                      {processingTicket === ticket.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Completing...
                                        </>
                                      ) : (
                                        "Complete Ticket"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                    ))
                  ) : (
                    <p className="text-sm sm:text-base text-muted-foreground text-center py-8">
                      {ticketSearch ? "No unhandled tickets found matching your search." : "No unhandled tickets"}
                    </p>
                  )}
                  </div>
                )}
              </div>

              {/* Handled Tickets */}
              <div className="flex flex-col border rounded-lg p-4 sm:p-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-between text-sm sm:text-base mb-4 shrink-0"
                  onClick={() => setHandledOpen(!handledOpen)}
                  size="sm"
                >
                  <span className="truncate">Handled Tickets ({handledTickets.length})</span>
                  {handledOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  )}
                </Button>
                {handledOpen && (
                  <div className="space-y-4">
                  {handledTickets.length > 0 ? (
                    handledTickets.map((ticket) => (
                      <div
                        id={`ticket-${ticket.id}`}
                        key={ticket.id}
                        className="border rounded-lg p-4 sm:p-6 space-y-4 transition-all bg-card hover:bg-muted/30 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-base sm:text-lg break-words mb-2">{ticket.title}</h4>
                            <p className="text-sm sm:text-base text-muted-foreground break-words leading-relaxed">{ticket.description}</p>
                          </div>
                          {ticket.solution && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                              <p className="text-sm font-semibold text-foreground mb-2">Solution:</p>
                              <p className="text-sm sm:text-base break-words leading-relaxed">{ticket.solution}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">From:</span>
                            <span className="font-medium break-words">{ticket.user?.name || ticket.email}</span>
                          </div>
                          {ticket.handledBy && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Handled by:</span>
                              <span className="font-medium break-words">{ticket.handledBy.name || ticket.handledBy.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm sm:text-base text-muted-foreground text-center py-8">
                      {ticketSearch ? "No handled tickets found matching your search." : "No handled tickets"}
                    </p>
                  )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Return to Notes Button */}
      <div className="flex justify-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => router.push("/notes")}
          size="sm"
          className="text-sm sm:text-base"
        >
          Return to Notes
        </Button>
      </div>
    </div>
  );
}

export default ControlPageClient;

