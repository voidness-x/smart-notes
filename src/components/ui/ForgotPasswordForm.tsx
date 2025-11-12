"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CardContent, CardFooter } from "./card";
import { Label } from "./label";
import { Input } from "./input";
import { useTransition } from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/auth/client";
import { emailSchema } from "@/lib/validation";
import { validateInput } from "@/lib/validation";

function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const email = formData.get("email") as string;

      if (!email) {
        toast.error("Error", {
          description: "Please enter your email address",
        });
        return;
      }

      // Validate email format
      const emailValidation = validateInput(emailSchema, email);
      if (!emailValidation.success) {
        toast.error("Error", {
          description: emailValidation.error,
        });
        return;
      }

      // Call Supabase client-side so PKCE code_verifier is stored in browser
      // This is required for password reset links to work with PKCE
      const supabase = createClient();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : "http://localhost:3000");

      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.data, {
        redirectTo: `${baseUrl}/reset-password`,
      });

      if (error) {
        // Don't reveal if email exists or not (security best practice)
        toast.error("Error", {
          description: "If an account exists with this email, a password reset link has been sent.",
        });
      } else {
        toast.success("Email Sent", {
          description: "Check your email for password reset instructions",
        });
        router.push("/login");
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <CardContent className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            placeholder="Enter your email"
            type="email"
            required
            disabled={isPending}
          />
          <p className="text-xs text-muted-foreground mt-2">
            We'll send you a link to reset your password
          </p>
        </div>
      </CardContent>
      <CardFooter className="mt-4 flex flex-col gap-6">
        <Button className="w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Send Reset Link"
          )}
        </Button>
        <p className="text-xs">
          Remember your password?{" "}
          <Link
            href="/login"
            className={`text-blue-500 underline ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Login
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default ForgotPasswordForm;

