"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/auth/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ensureUserInDatabase } from "@/actions/users";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
 
  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient();
      
      // Get the token and type from URL hash or query params
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const searchParamsObj = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get("access_token") || searchParamsObj.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParamsObj.get("refresh_token");
      const code = hashParams.get("code") || searchParamsObj.get("code");
      const type = hashParams.get("type") || searchParamsObj.get("type");
      
      // Get error parameters (but don't use them to determine success/failure)
      const error = hashParams.get("error") || searchParamsObj.get("error");
      const errorCode = hashParams.get("error_code") || searchParamsObj.get("error_code");
      const errorDescription = hashParams.get("error_description") || searchParamsObj.get("error_description");

      console.log("Email confirmation - type:", type, "has tokens:", !!accessToken, "has code:", !!code, "error:", error);

      // PRIORITY 1: Check if user is already logged in (email might already be confirmed)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        console.log("User already has an active session, email is confirmed");
        // User is already logged in, so email is confirmed - show success
        try {
          const dbResult = await ensureUserInDatabase(
            existingSession.user.id,
            existingSession.user.email || ""
          );
          if (dbResult.errorMessage) {
            console.error("Failed to ensure user in database:", dbResult.errorMessage);
          } else {
            console.log("User ensured in database:", existingSession.user.id);
          }
        } catch (err) {
          console.error("Error ensuring user in database:", err);
        }
        
        setStatus("success");
        // Clear any error params from URL
        window.history.replaceState(null, "", "/auth/confirm");
        setTimeout(() => {
          router.push("/notes");
        }, 2000);
        return;
      }

      // PRIORITY 2: Try to process the confirmation code/tokens first
      // This is the actual confirmation flow - if this succeeds, the email is confirmed
      let sessionData: any = null;
      let sessionError: any = null;
      let confirmationAttempted = false;

      // Handle code-based confirmation (newer Supabase format) - this is the primary method
      if (code) {
        confirmationAttempted = true;
        console.log("Attempting to exchange code for session, code:", code.substring(0, 20) + "...");
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          sessionData = data;
          sessionError = error;
          
          if (data?.session && data?.user) {
            console.log("Code exchange successful, session created, user:", data.user.id);
          } else if (error) {
            console.error("Code exchange failed:", error.message || error);
          } else {
            console.log("Code exchange completed but no session in response");
          }
        } catch (err: any) {
          console.error("Error exchanging code for session:", err?.message || err);
          sessionError = err;
        }
      }
      // Handle token-based confirmation (older format)
      else if (type === "signup" && accessToken && refreshToken) {
        confirmationAttempted = true;
        console.log("Attempting to set session with tokens");
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          sessionData = data;
          sessionError = error;
          
          if (data?.session && data?.user) {
            console.log("Token session set successfully, user:", data.user.id);
          } else if (error) {
            console.error("Token session set failed:", error.message || error);
          } else {
            console.log("Token session set completed but no session in response");
          }
        } catch (err: any) {
          console.error("Error setting session:", err?.message || err);
          sessionError = err;
        }
      }

      // PRIORITY 3: Check if confirmation was successful
      // Check for active session after the exchange attempt - this is the most reliable way
      // Wait a bit for the session to be set (it might be asynchronous)
      if (confirmationAttempted) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      
      // If we have an active session, the confirmation succeeded regardless of error params
      if (activeSession?.user) {
        console.log("Active session found after confirmation attempt, user:", activeSession.user.id);
        console.log("Email confirmed successfully!");
        
        // Ensure user exists in database (in case it wasn't created during signup)
        try {
          const dbResult = await ensureUserInDatabase(
            activeSession.user.id,
            activeSession.user.email || ""
          );
          if (dbResult.errorMessage) {
            console.error("Failed to ensure user in database:", dbResult.errorMessage);
            // Continue anyway - user can still login
          } else {
            console.log("User ensured in database:", activeSession.user.id);
          }
        } catch (err) {
          console.error("Error ensuring user in database:", err);
          // Continue anyway - user can still login
        }
        
        setStatus("success");
        
        // Clear the URL hash/query params
        window.history.replaceState(null, "", "/auth/confirm");
        
        // Redirect to notes after a short delay
        setTimeout(() => {
          router.push("/notes");
        }, 2000);
        return;
      }
      
      // If we got a session from the exchange but it's not active yet, still consider it success
      if (sessionData?.session && sessionData?.user && !sessionError) {
        console.log("Session returned from exchange, treating as success, user:", sessionData.user.id);
        
        // Ensure user exists in database
        try {
          const dbResult = await ensureUserInDatabase(
            sessionData.user.id,
            sessionData.user.email || ""
          );
          if (dbResult.errorMessage) {
            console.error("Failed to ensure user in database:", dbResult.errorMessage);
          } else {
            console.log("User ensured in database:", sessionData.user.id);
          }
        } catch (err) {
          console.error("Error ensuring user in database:", err);
        }
        
        setStatus("success");
        window.history.replaceState(null, "", "/auth/confirm");
        setTimeout(() => {
          router.push("/notes");
        }, 2000);
        return;
      }

      // PRIORITY 4: If confirmation failed, check for errors
      // Only show error if we actually tried to confirm and it failed
      if (confirmationAttempted && sessionError) {
        console.error("Error confirming email:", sessionError);
        // Check the actual error from the session exchange
        if (sessionError.message?.includes("expired") || sessionError.message?.includes("OTP") || errorCode === "otp_expired") {
          setErrorMessage("This confirmation link has expired. However, your email may already be confirmed. Please try logging in.");
        } else if (sessionError.message?.includes("invalid") || sessionError.message?.includes("Invalid")) {
          setErrorMessage("Invalid confirmation link. Your email may already be confirmed - please try logging in.");
        } else {
          setErrorMessage(sessionError.message || "Failed to confirm email. Your email may already be confirmed - please try logging in.");
        }
        setStatus("error");
        return;
      }

      // PRIORITY 5: If no confirmation method was available, check for error params
      // This means there was no code or tokens to process
      if (!confirmationAttempted) {
        if (error && !code && !accessToken) {
          // Only show error if there's no way to confirm (no code, no tokens)
          if (errorCode === "otp_expired" || errorCode === "token_expired") {
            setErrorMessage("This confirmation link has expired. However, your email may already be confirmed. You can try logging in.");
          } else {
            setErrorMessage(errorDescription || error || "Invalid confirmation link. Your email may already be confirmed - please try logging in.");
          }
          setStatus("error");
          return;
        }

        // No confirmation method and no clear error - might be a malformed link
        if (type && type !== "signup") {
          // Not an email confirmation link
          setErrorMessage("Invalid confirmation link type.");
          setStatus("error");
          return;
        }

        // No valid confirmation method found and no error params
        console.log("No valid confirmation token or code found");
        setErrorMessage("Invalid or missing confirmation link. Your email may already be confirmed - please try logging in.");
        setStatus("error");
      }
    };

    confirmEmail();
  }, [router, searchParams]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold">Confirming your email...</h1>
          <p className="text-muted-foreground">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">Email Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Your email has been successfully confirmed. Redirecting you to your notes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if error message suggests email might be confirmed
  const isExpiredLink = errorMessage?.includes("expired") || errorMessage?.includes("already be confirmed");
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          {isExpiredLink ? (
            // Show warning icon for expired links (email might still be confirmed)
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg
                className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          ) : (
            // Show error icon for actual failures
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
          <h1 className="text-3xl font-bold">
            {isExpiredLink ? "Link Expired or Invalid" : "Confirmation Failed"}
          </h1>
          <p className="text-lg text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Try Logging In</Link>
          </Button>
          {!isExpiredLink && (
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/sign-up">Sign Up Again</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

