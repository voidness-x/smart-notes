"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CardContent, CardFooter } from "./card";
import { Label } from "./label";
import { Input } from "./input";
import { useTransition, useEffect, useState } from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/auth/client";

function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isExchangingToken, setIsExchangingToken] = useState(true);

  useEffect(() => {
    // Exchange the token/code from URL hash or query params for a session
    const exchangeToken = async () => {
      const supabase = createClient();
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(window.location.search);

      console.log("Reset password - hash:", hash);
      console.log("Reset password - search params:", window.location.search);
      console.log("Reset password - full URL:", window.location.href);

      // Check if there's already a session (user might already be authenticated)
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession.session) {
        console.log("Session already exists");
        setIsValidToken(true);
        setIsExchangingToken(false);
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let code: string | null = null;
      let type: string | null = null;
      let error: string | null = null;
      let errorCode: string | null = null;

      // Check for error parameters first
      error = hashParams.get("error") || searchParams.get("error");
      errorCode = hashParams.get("error_code") || searchParams.get("error_code");

      // Try to get code first (newer Supabase format for password reset)
      code = hashParams.get("code") || searchParams.get("code");

      // Try to get tokens from hash (older format)
      if (!code && hash.includes("access_token")) {
        try {
          accessToken = hashParams.get("access_token");
          refreshToken = hashParams.get("refresh_token");
          type = hashParams.get("type");
          console.log("Found tokens in hash, type:", type);
        } catch (err) {
          console.error("Error parsing hash:", err);
        }
      }

      // Fallback: try query parameters
      if (!code && !accessToken && searchParams.has("access_token")) {
        accessToken = searchParams.get("access_token");
        refreshToken = searchParams.get("refresh_token");
        type = searchParams.get("type");
        console.log("Found tokens in query params, type:", type);
      }

      // Handle code-based password reset
      // Supabase password reset with PKCE requires special handling
      // The code from the URL needs to be exchanged, but PKCE requires a code_verifier
      // For password reset, Supabase may use a different flow
      if (code) {
        try {
          console.log("Attempting to process password reset code");
          
          // For password reset, Supabase might send the code in the URL
          // We need to check if this is a PKCE flow or a recovery token flow
          // Try to get code_verifier from Supabase's storage (it stores it automatically)
          // Supabase client should handle PKCE automatically if the code_verifier is in storage
          
          // First, try exchangeCodeForSession - Supabase client should handle PKCE automatically
          // if the code_verifier was stored when the reset email was requested
          console.log("Trying exchangeCodeForSession (Supabase handles PKCE automatically)");
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            console.error("Error exchanging code for session:", sessionError);
            
            // If it's a PKCE error, the code_verifier is missing
            // This happens when the reset email was sent server-side and we don't have the verifier
            if (sessionError.message?.includes("code verifier") || sessionError.message?.includes("non-empty")) {
              console.log("PKCE error - code_verifier missing. This happens when reset email is sent server-side.");
              
              // For server-side password reset, we need to use a different approach
              // Try verifyOtp as fallback (though this might not work either)
              console.log("Trying verifyOtp as fallback");
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: code,
                type: 'recovery'
              });
              
              if (!verifyError && verifyData?.session) {
                console.log("Recovery token verified successfully via verifyOtp");
                setIsValidToken(true);
                window.history.replaceState(null, "", window.location.pathname);
                setIsExchangingToken(false);
                return;
              }
              
              // Both methods failed - provide helpful error message
              toast.error("Error", {
                description: "This password reset link cannot be processed automatically. Please request a new password reset link, or try copying the full URL from your email and pasting it directly into your browser.",
              });
              setIsValidToken(false);
              setIsExchangingToken(false);
              return;
            } else {
              // Other error
              toast.error("Error", {
                description: sessionError.message || "Failed to validate reset link. The link may have expired.",
              });
              setIsValidToken(false);
              setIsExchangingToken(false);
              return;
            }
          }

          if (sessionData?.session) {
            console.log("Session set successfully from code");
            setIsValidToken(true);
            window.history.replaceState(null, "", window.location.pathname);
            setIsExchangingToken(false);
            return;
          }
          
          // If we get here, exchange succeeded but no session
          console.log("Code exchange succeeded but no session returned");
          toast.error("Error", {
            description: "Failed to validate reset link. The link may have expired.",
          });
          setIsValidToken(false);
          setIsExchangingToken(false);
          return;
        } catch (err: any) {
          console.error("Error during code verification:", err);
          toast.error("Error", {
            description: err?.message || "Failed to process reset link. The link may have expired.",
          });
          setIsValidToken(false);
          setIsExchangingToken(false);
          return;
        }
      }

      // Handle token-based password reset (older format)
      if (accessToken && refreshToken && type === "recovery") {
        try {
          console.log("Attempting to set session with tokens");
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            toast.error("Error", {
              description: sessionError.message || "Failed to validate reset link. The link may have expired.",
            });
            setIsValidToken(false);
            setIsExchangingToken(false);
            return;
          }

          if (sessionData.session) {
            console.log("Session set successfully from tokens");
            setIsValidToken(true);
            window.history.replaceState(null, "", window.location.pathname);
            setIsExchangingToken(false);
            return;
          }
        } catch (err) {
          console.error("Error during token exchange:", err);
          toast.error("Error", {
            description: "Failed to process reset link. The link may have expired.",
          });
          setIsValidToken(false);
          setIsExchangingToken(false);
          return;
        }
      }

      // No valid token/code found
      if (error) {
        console.log("Error found in URL:", error, errorCode);
        if (errorCode === "token_expired" || errorCode === "otp_expired") {
          toast.error("Error", {
            description: "This reset link has expired. Please request a new password reset.",
          });
        } else {
          toast.error("Error", {
            description: "Invalid or expired reset link. Please request a new password reset.",
          });
        }
      } else {
        console.log("No valid reset token/code found in URL");
        toast.error("Error", {
          description: "Invalid or missing reset link. Please request a new password reset.",
        });
      }
      
      setIsValidToken(false);
      setIsExchangingToken(false);
      
      // Clear URL after a delay
      setTimeout(() => {
        if (hash || searchParams.toString()) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }, 3000);
    };

    exchangeToken();
  }, []);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!password || !confirmPassword) {
        toast.error("Error", {
          description: "Please fill in all fields",
        });
        return;
      }

      if (password.length < 8) {
        toast.error("Error", {
          description: "Password must be at least 8 characters",
        });
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Error", {
          description: "Passwords do not match",
        });
        return;
      }

      // Verify we have a valid session before updating password
      const supabase = createClient();
      
      // Check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error("Error", {
          description: "Your reset link has expired or is invalid. Please request a new password reset.",
        });
        return;
      }
      
      // Update the password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        toast.error("Error", {
          description: "Failed to update password. Please try again.",
        });
      } else {
        toast.success("Success", {
          description: "Password updated successfully. You can now log in with your new password.",
        });
        // Sign out after password update to ensure clean state
        await supabase.auth.signOut();
        // Wait a moment, then redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    });
  };

  if (isValidToken === null || isExchangingToken) {
    return (
      <CardContent className="grid w-full items-center gap-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </CardContent>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <CardContent className="grid w-full items-center gap-4">
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Invalid or expired reset link. Please request a new password reset.
            </p>
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-6">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full">Request New Reset Link</Button>
          </Link>
          <p className="text-xs">
            <Link href="/login" className="text-blue-500 underline">
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </>
    );
  }

  return (
    <form action={handleSubmit}>
      <CardContent className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            placeholder="Enter your new password"
            type="password"
            required
            disabled={isPending}
            minLength={6}
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your new password"
            type="password"
            required
            disabled={isPending}
            minLength={6}
          />
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex flex-col gap-6">
        <Button className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Reset Password"
          )}
        </Button>
        <p className="text-xs">
          <Link
            href="/login"
            className={`text-blue-500 underline ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Back to Login
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default ResetPasswordForm;

