"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner"
import { CardContent, CardFooter } from "./card";
import { Label } from "./label";
import { Input } from "./input";
import { useTransition, useState } from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { loginAction, signUpAction, resendConfirmationEmailAction } from "@/actions/users";

type Props = {
    type: "login" | "signUp";
};

function AuthForm({ type }: Props) {
    const isLoginForm = type === "login";

    const router = useRouter();

    const [isPending, startTransition] = useTransition();
    const [lastLoginEmail, setLastLoginEmail] = useState<string>("");
    const [showResendConfirmation, setShowResendConfirmation] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (isLoginForm) {
            setLastLoginEmail(email);
            startTransition(async () => {
                try {
                    const result = await loginAction(email, password);
                    
                    if (result.errorMessage) {
                        // Login failed - show error message
                        // Check if error is about email confirmation
                        const isEmailConfirmationError = result.errorMessage.toLowerCase().includes("confirm") || 
                                                         result.errorMessage.toLowerCase().includes("email");
                        setShowResendConfirmation(isEmailConfirmationError);
                        
                        toast.error("Login Failed", {
                            description: result.errorMessage || "Invalid email or password. Please check your credentials and try again.",
                        });
                    } else if (result.success) {
                        setShowResendConfirmation(false);
                        // Login successful - redirect
                        toast.success("Logged in", {
                            description: "You have been successfully logged in",
                        });
                        // Redirect immediately - cookies are set by the server action
                        // Using window.location ensures a complete page reload with fresh cookies
                        window.location.href = "/notes";
                    } else {
                        // Unexpected case - no error but also no success
                        toast.error("Error", {
                            description: "Login failed. Please try again.",
                        });
                    }
                } catch (err: any) {
                    // Log the error for debugging
                    console.error("AuthForm login error:", err);
                    
                    // Show the actual error message if available
                    const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
                    toast.error("Error", {
                        description: errorMessage,
                    });
                }
            });
        } else {
            // Sign up form
            startTransition(async () => {
                try {
                    const result = await signUpAction(email, password);
                    
                    if (result.errorMessage) {
                        // Sign up failed - show error message
                        toast.error("Sign Up Failed", {
                            description: result.errorMessage || "Failed to sign up. Please try again.",
                            duration: 8000, // Show longer so user can read it
                        });
                    } else if (result.success) {
                        // Sign up successful - redirect
                        const emailConfirmed = (result as any).emailConfirmed === true;
                        const emailSent = (result as any).emailSent === true;
                        
                        // Store email for potential resend
                        setLastLoginEmail(email);
                        
                        let description = "";
                        if (emailConfirmed) {
                            // If email is confirmed, user can log in immediately
                            // This might mean email confirmations are disabled in Supabase
                            description = "Account created successfully! You can log in now.";
                        } else if (emailSent) {
                            description = "Account created! Please check your email (and spam folder) and click the confirmation link before logging in.";
                        } else {
                            description = "Account created! However, no confirmation email was sent. This might be due to Supabase email configuration. You can try logging in - if email confirmation is disabled, you should be able to log in directly.";
                        }
                        
                        // Show resend button if email wasn't confirmed
                        if (!emailConfirmed) {
                            setShowResendConfirmation(true);
                        }
                        
                        toast.success("Signed Up", {
                            description: description,
                            duration: 10000, // Show longer for important message
                        });
                        router.push("/login");
                    } else {
                        // Unexpected case - no error but also no success
                        toast.error("Error", {
                            description: "Sign up failed. Please try again.",
                        });
                    }
                } catch (err: any) {
                    // Log the error for debugging
                    console.error("AuthForm signup error:", err);
                    
                    // Show the actual error message if available
                    const errorMessage = err?.message || "An unexpected error occurred. Please try again.";
                    toast.error("Error", {
                        description: errorMessage,
                    });
                }
            });
        }
    };

    return (
    <form onSubmit={handleSubmit}>
        <CardContent className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email </Label>
                <Input
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    type="email"
                    required disabled={isPending}
                />           
            </div>
            <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password </Label>
                <Input
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type="password"
                    required disabled={isPending}
                />           
            </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-6">
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                    <Loader2 className="animate-spin"/>
                    ) : isLoginForm ? (
                        "Login"
                    ) : (
                        "Sign Up"
                    )}
            </Button>
            <div className="flex flex-col gap-2">
                {isLoginForm && (
                    <>
                        <Link 
                            href="/forgot-password"
                            className={`text-xs text-blue-500 underline text-center ${isPending ? "pointer-events-none opacity-50" : ""}`}
                        >
                            Forgot password?
                        </Link>
                        {showResendConfirmation && lastLoginEmail && (
                            <button
                                type="button"
                                onClick={async () => {
                                    startTransition(async () => {
                                        const result = await resendConfirmationEmailAction(lastLoginEmail);
                                        if (result.errorMessage) {
                                            toast.error("Error", {
                                                description: result.errorMessage,
                                            });
                                        } else {
                                            toast.success("Confirmation email sent", {
                                                description: "Please check your email for the confirmation link.",
                                            });
                                        }
                                    });
                                }}
                                disabled={isPending}
                                className={`text-xs text-blue-500 underline text-center ${isPending ? "pointer-events-none opacity-50" : ""}`}
                            >
                                Resend confirmation email
                            </button>
                        )}
                    </>
                )}
                {!isLoginForm && showResendConfirmation && lastLoginEmail && (
                    <button
                        type="button"
                        onClick={async () => {
                            startTransition(async () => {
                                const result = await resendConfirmationEmailAction(lastLoginEmail);
                                if (result.errorMessage) {
                                    toast.error("Error", {
                                        description: result.errorMessage,
                                    });
                                } else {
                                    toast.success("Confirmation email sent", {
                                        description: "Please check your email (and spam folder) for the confirmation link.",
                                        duration: 8000,
                                    });
                                }
                            });
                        }}
                        disabled={isPending}
                        className={`text-xs text-blue-500 underline text-center ${isPending ? "pointer-events-none opacity-50" : ""}`}
                    >
                        Resend confirmation email
                    </button>
                )}
                <p className="text-xs">
                    {isLoginForm
                      ? "Don't have an account yet?"
                      : "Already have an account?"}{" "}
                    <Link 
                      href={isLoginForm ? "/sign-up" : "/login"}
                      className={`text-blue-500 underline ${isPending ? "pointer-events-none opacity-50" : ""}`}
                    >
                      {isLoginForm ? "Sign Up" : "Login"}
                    </Link>
                </p>
            </div>
        </CardFooter>
    </form>
    );
}

export default AuthForm;