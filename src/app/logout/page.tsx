"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { logOutAction } from "@/actions/users";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    // Perform logout when page loads
    const handleLogout = async () => {
      try {
        await logOutAction();
      } catch (error) {
        console.error("Error during logout:", error);
      } finally {
        setIsLoggingOut(false);
      }
    };

    handleLogout();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {isLoggingOut ? (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-semibold">Logging out...</h1>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold">You have logged out</h1>
              <p className="text-lg text-muted-foreground">
                Thank you for using Smart Notes. You have been successfully logged out.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/">Return to Landing Page</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Login Again</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

