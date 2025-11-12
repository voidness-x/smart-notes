"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { createSupportTicketAction, submitTicketSatisfactionAction, getMySupportTicketsAction } from "@/actions/support";
import { toast } from "sonner";
import { Loader2, X, CheckCircle2, XCircle } from "lucide-react";
import imageCompression from "browser-image-compression";

type Props = {
  user: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
  tickets: Array<{
    id: string;
    email: string;
    title: string;
    description: string;
    photoUrl?: string | null;
    status: string;
    createdAt: Date;
    satisfied?: boolean | null;
    handledBy?: {
      id: string;
      name?: string | null;
      email: string;
    } | null;
  }>;
};

function SupportPageClient({ user, tickets: initialTickets }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(user?.email || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState(initialTickets);
  const [satisfactionStates, setSatisfactionStates] = useState<Record<string, "idle" | "yes" | "no">>({});

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Error", { description: "Please select an image file" });
      return;
    }

    try {
      const options = {
        maxSizeMB: 0.6,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.8,
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        setPhotoUrl(base64Image);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Error", { description: "Failed to process image" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !title || !description) {
      toast.error("Error", { description: "Please fill in all required fields" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createSupportTicketAction(
        email,
        title,
        description,
        photoUrl || undefined
      );

      if (result.errorMessage) {
        toast.error("Error", { description: result.errorMessage });
      } else {
        toast.success("Success", { description: "Support ticket created successfully" });
        setEmail(user?.email || "");
        setTitle("");
        setDescription("");
        setPhotoUrl(null);
        
        // Refresh tickets
        if (user) {
          const ticketsResult = await getMySupportTicketsAction();
          setTickets(ticketsResult.tickets || []);
        }
      }
    } catch (error) {
      toast.error("Error", { description: "Failed to create support ticket" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSatisfaction = async (ticketId: string, satisfied: boolean) => {
    setSatisfactionStates(prev => ({ ...prev, [ticketId]: satisfied ? "yes" : "no" }));
    
    const result = await submitTicketSatisfactionAction(ticketId, satisfied);
    
    if (result.errorMessage) {
      toast.error("Error", { description: result.errorMessage });
      setSatisfactionStates(prev => ({ ...prev, [ticketId]: "idle" }));
    } else {
      if (satisfied) {
        toast.success("Success", { description: "We work to serve you well." });
      }
      // Update ticket in state
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, satisfied } : t
      ));
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
    <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 pb-4 sm:pb-8 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
        <Image
          src="/Smart Notes.png"
          height={80}
          width={80}
          alt="Smart Notes"
          className="rounded-full h-16 w-16 sm:h-20 sm:w-20"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Smart Notes Support</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            We value your feedback and want to help you as much as possible.
          </p>
        </div>
      </div>

      {/* Contact Email */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Contact us at: <a href="mailto:smart.note.contact@gamil.com" className="text-primary hover:underline">smart.note.contact@gamil.com</a>
        </p>
      </div>

      {/* Support Form */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={!!user}
            className="text-sm sm:text-base"
          />
        </div>

        <div>
          <Label htmlFor="title" className="text-sm sm:text-base">Title of the Problem</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of your issue"
            required
            className="text-sm sm:text-base"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm sm:text-base">Describe the Problem</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide detailed information about your issue..."
            rows={6}
            required
            className="text-sm sm:text-base"
          />
        </div>

        <div>
          <Label htmlFor="photo" className="text-sm sm:text-base">Attach Photo (Optional)</Label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="cursor-pointer text-xs sm:text-sm"
            />
            {photoUrl && (
              <div className="relative">
                <img
                  src={photoUrl}
                  alt="Preview"
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(null);
                  }}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full text-sm sm:text-base">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Ticket"
          )}
        </Button>
      </form>

      {/* Tickets Review Section */}
      {tickets.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold">Your Support Tickets</h2>
          <div className="space-y-3 sm:space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg break-words">{ticket.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                      {ticket.description}
                    </p>
                    {ticket.photoUrl && (
                      <img
                        src={ticket.photoUrl}
                        alt="Ticket attachment"
                        className="mt-2 max-w-full sm:max-w-xs rounded border"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    Sent: {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`font-semibold ${getStatusColor(ticket.status)} shrink-0`}>
                    Status: {getStatusLabel(ticket.status)}
                  </span>
                </div>

                {ticket.status === "complete" && ticket.satisfied === null && (
                  <div className="pt-2 border-t">
                    <p className="text-xs sm:text-sm font-medium mb-2">Are you satisfied?</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSatisfaction(ticket.id, true)}
                        className="text-green-600 border-green-600 hover:bg-green-50 text-xs sm:text-sm"
                      >
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSatisfaction(ticket.id, false)}
                        className="text-red-600 border-red-600 hover:bg-red-50 text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        No
                      </Button>
                    </div>
                  </div>
                )}

                {ticket.status === "complete" && ticket.satisfied === true && (
                  <div className="pt-2 border-t">
                    <p className="text-xs sm:text-sm text-green-600 font-medium">We work to serve you well.</p>
                  </div>
                )}

                {ticket.status === "complete" && ticket.satisfied === false && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs sm:text-sm text-red-600 font-medium">We're sorry to hear that.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/support")}
                      className="text-primary text-xs sm:text-sm"
                    >
                      Open Another Ticket
                    </Button>
                  </div>
                )}

                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                  We will process your issue and contact you on email if necessary.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return to Notes Button */}
      <div className="flex justify-center pt-2 sm:pt-4">
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

export default SupportPageClient;

