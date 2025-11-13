"use server"

import { createClient, getUser } from "@/auth/server"
import { handleError } from "@/lib/utils"
import { prisma } from "@/db/prisma";
import { validateInput, emailSchema, passwordSchema, userNameSchema } from "@/lib/validation";
import { requireAuth } from "@/lib/helpers";

export const loginAction = async (email: string, password: string) => {
    try {
        // Validate inputs
        const emailValidation = validateInput(emailSchema, email);
        if (!emailValidation.success) {
            return { errorMessage: emailValidation.error, success: false };
        }

        const passwordValidation = validateInput(passwordSchema, password);
        if (!passwordValidation.success) {
            return { errorMessage: "Invalid email or password", success: false };
        }

        const {auth} = await createClient();

        const {data, error} = await auth.signInWithPassword({
            email: emailValidation.data, 
            password: passwordValidation.data,
        });
        
        if (error) {
            // Check for specific error codes related to email confirmation
            let errorMessage = "Invalid email or password";
            
            // Supabase returns specific errors for unconfirmed emails
            if (error.message?.includes("email") && error.message?.includes("confirm")) {
                errorMessage = "Please check your email and click the confirmation link before logging in.";
            } else if (error.message?.includes("Email not confirmed")) {
                errorMessage = "Please check your email and click the confirmation link before logging in.";
            }
            
            return { 
                errorMessage,
                success: false 
            };
        }
        
        // Ensure user exists in database (in case they were deleted but Supabase Auth user still exists)
        // Don't fail login if database operations fail - authentication is the priority
        if (data.user?.id && data.user?.email) {
            try {
                const existingUser = await prisma.user.findUnique({
                    where: { id: data.user.id },
                });

                if (!existingUser) {
                    // User doesn't exist in database, create them
                    try {
                        await prisma.user.create({
                            data: {
                                id: data.user.id,
                                email: data.user.email,
                            },
                        });
                    } catch (createError: any) {
                        // If user creation fails (race condition, connection issue, etc.), continue anyway
                        // User can still login - database sync can happen later
                        console.error("Failed to create user in database:", createError?.message || createError);
                    }
                }
            } catch (dbError: any) {
                // Database connection or query failed - log but don't fail login
                // Authentication succeeded, which is the primary concern
                console.error("Database error during login (non-fatal):", dbError?.message || dbError);
                // Continue with login - database sync can happen later
            }
        }
        
        // If successful, the cookies are automatically set by the createClient cookie handler
        // Return success - the client will handle the redirect
        return { errorMessage: null, success: true};

    } catch (error: any) {
        // Always log the actual error for debugging in Vercel logs
        console.error("Login error:", {
            message: error?.message,
            code: error?.code,
            stack: error?.stack,
            name: error?.name,
            fullError: error
        });
        
        // Check for specific error types
        if (error?.code === 'P1001') {
            return { errorMessage: "Database connection failed. Please try again in a moment.", success: false };
        }
        
        if (error?.message?.includes("Prisma") || error?.message?.includes("database") || error?.code?.startsWith('P')) {
            return { errorMessage: "Database error. Please try again.", success: false };
        }
        
        if (error?.message?.includes("SUPABASE") || error?.message?.includes("Supabase") || error?.message?.includes("Missing Supabase")) {
            return { errorMessage: "Authentication service error. Please try again.", success: false };
        }
        
        // Return the actual error message if available, otherwise generic
        const errorMsg = error?.message || error?.toString() || "An error occurred during login. Please try again.";
        return { 
            errorMessage: errorMsg, 
            success: false 
        };
    } 
};

export const logOutAction = async () => {
    try {
        const {auth} = await createClient();

        const {error} = await auth.signOut();
        if (error) throw error;
        return { errorMessage: null};
    } catch (error) {
        return handleError(error);
    }
};

export const signUpAction = async (email: string, password: string) => {
    try {
        // Validate inputs
        const emailValidation = validateInput(emailSchema, email);
        if (!emailValidation.success) {
            return { errorMessage: emailValidation.error, success: false };
        }

        const passwordValidation = validateInput(passwordSchema, password);
        if (!passwordValidation.success) {
            return { errorMessage: passwordValidation.error, success: false };
        }

        const {auth} = await createClient();

        // Get base URL for email confirmation redirect
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : "http://localhost:3000");

        const {data, error} = await auth.signUp({
            email: emailValidation.data, 
            password: passwordValidation.data,
            options: {
                emailRedirectTo: `${baseUrl}/auth/confirm`,
            },
        });

        if (error) {
            // Return generic error message to avoid information disclosure
            return { 
                errorMessage: "Failed to sign up. Please check your email and password, then try again.", 
                success: false 
            };
        }

        const userId = data.user?.id;
        if (!userId) {
            return { 
                errorMessage: "Error signing up. Please try again.", 
                success: false 
            };
        }

        // Check if email confirmation is required
        const emailConfirmed = data.user?.email_confirmed_at !== null;
        const emailSent = data.user?.confirmation_sent_at !== null;

        // Create user in database - this is required for our app to work
        let dbUserCreated = false;
        try {
            await prisma.user.create({
                data: {
                  id: userId,
                  email: emailValidation.data,
                },
            });
            dbUserCreated = true;
            
            // Verify the user was actually created
            const verifyUser = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!verifyUser) {
                throw new Error("Failed to verify user creation in database");
            }
        } catch (dbError: any) {
            // If user already exists (e.g., from a previous signup attempt), verify they exist
            if (dbError?.code === 'P2002') {
                const existingUser = await prisma.user.findUnique({
                    where: { id: userId },
                });
                if (existingUser) {
                    dbUserCreated = true;
                } else {
                    throw new Error("Database error: User creation failed");
                }
            } else {
                throw new Error("Failed to create user in database");
            }
        }

        if (!dbUserCreated) {
            throw new Error("Failed to create user in database");
        }
        
        return { 
            errorMessage: null, 
            success: true,
            emailConfirmed,
            emailSent,
            userId,
        };
    }
    catch (error) {
        return { errorMessage: "Failed to sign up. Please try again.", success: false };
    }
}

export const updateAvatarAction = async (avatarUrl: string) => {
    try {
        const user = await getUser();
        if (!user) throw new Error("You must be logged in to update your avatar");

        // Validate avatarUrl - should be base64 data URL or valid URL
        if (!avatarUrl || (typeof avatarUrl === 'string' && avatarUrl.length > 1000000)) {
            throw new Error("Invalid avatar URL");
        }

        // Ensure user exists in database
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!existingUser) {
            // Create user if they don't exist
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email || "",
                },
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { avatarUrl: avatarUrl.substring(0, 1000000) }, // Limit size
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const updateUserNameAction = async (name: string) => {
    try {
        const user = await requireAuth();
        const nameValidation = validateInput(userNameSchema, name || "");
        if (!nameValidation.success && name.trim() !== "") {
            throw new Error(nameValidation.error);
        }

        const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!existingUser) {
            await prisma.user.create({ data: { id: user.id, email: user.email || "" } });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { name: nameValidation.success ? nameValidation.data : null },
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const resendConfirmationEmailAction = async (email: string) => {
    try {
        // Validate email
        const emailValidation = validateInput(emailSchema, email);
        if (!emailValidation.success) {
            return { errorMessage: emailValidation.error };
        }

        const { auth } = await createClient();

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : "http://localhost:3000");

        const { error } = await auth.resend({
            type: "signup",
            email: emailValidation.data,
            options: {
                emailRedirectTo: `${baseUrl}/auth/confirm`,
            },
        });

        if (error) {
            return { 
                errorMessage: "Failed to resend confirmation email. Please try again.",
            };
        }

        return { errorMessage: null };
    } catch (error) {
        return { errorMessage: "Failed to resend confirmation email. Please try again." };
    }
};

export const resetPasswordAction = async (email: string) => {
    try {
        // Validate email
        const emailValidation = validateInput(emailSchema, email);
        if (!emailValidation.success) {
            return { errorMessage: emailValidation.error };
        }

        const { auth } = await createClient();

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : "http://localhost:3000");

        const { error } = await auth.resetPasswordForEmail(emailValidation.data, {
            redirectTo: `${baseUrl}/reset-password`,
        });

        if (error) {
            // Don't reveal if email exists or not (security best practice)
            return { errorMessage: "If an account exists with this email, a password reset link has been sent." };
        }
        return { errorMessage: null };
    } catch (error) {
        return { errorMessage: "Failed to send password reset email. Please try again." };
    }
};

export const ensureUserInDatabase = async (userId: string, email: string) => {
    try {
        // Validate inputs
        if (!userId || !email) {
            return { errorMessage: "Invalid user data" };
        }

        // Validate email format
        const emailValidation = validateInput(emailSchema, email);
        if (!emailValidation.success) {
            return { errorMessage: "Invalid email format" };
        }

        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (existingUser) {
            return { errorMessage: null, userExists: true };
        }

        // Create user if it doesn't exist
        await prisma.user.create({
            data: {
                id: userId,
                email: emailValidation.data,
            },
        });

        return { errorMessage: null, userExists: false };
    } catch (error: any) {
        if (error?.code === 'P2002') {
            // User already exists (race condition)
            return { errorMessage: null, userExists: true };
        }
        return { errorMessage: "Failed to create user in database" };
    }
};

export const updatePasswordAction = async (newPassword: string) => {
    try {
        // Validate password
        const passwordValidation = validateInput(passwordSchema, newPassword);
        if (!passwordValidation.success) {
            return { errorMessage: passwordValidation.error };
        }

        const { auth } = await createClient();

        const { error } = await auth.updateUser({
            password: passwordValidation.data,
        });

        if (error) {
            return { errorMessage: "Failed to update password. Please try again." };
        }
        return { errorMessage: null };
    } catch (error) {
        return { errorMessage: "Failed to update password. Please try again." };
    }
};

export const getAllUsersAction = async () => {
    try {
        const user = await getUser();
        if (!user) {
            return {
                errorMessage: "You must be logged in",
                users: [],
            };
        }

        // Check if user is admin or supervisor
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (userData?.role !== "admin" && userData?.role !== "supervisor") {
            return {
                errorMessage: "Unauthorized",
                users: [],
            };
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                lastActiveAt: true,
                role: true,
                blocked: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1000, // Limit to prevent abuse
        });

        return { errorMessage: null, users };
    } catch (error) {
        return { errorMessage: "Failed to fetch users", users: [] };
    }
};

export const promoteToAdminAction = async (userId: string) => {
    try {
        const user = await getUser();
        if (!user) {
            return {
                errorMessage: "You must be logged in",
                success: false,
            };
        }

        // Validate userId
        if (!userId || typeof userId !== 'string') {
            return {
                errorMessage: "Invalid user ID",
                success: false,
            };
        }

        // Check if user is supervisor (only supervisor can promote)
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (userData?.role !== "supervisor") {
            return {
                errorMessage: "Unauthorized",
                success: false,
            };
        }

        // Don't allow promoting self
        if (userId === user.id) {
            return {
                errorMessage: "You cannot promote yourself",
                success: false,
            };
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!targetUser) {
            return {
                errorMessage: "User not found",
                success: false,
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: "admin" },
        });

        return { errorMessage: null, success: true };
    } catch (error) {
        return { errorMessage: "Failed to promote user", success: false };
    }
};

export const demoteFromAdminAction = async (userId: string) => {
    try {
        const user = await getUser();
        if (!user) {
            return {
                errorMessage: "You must be logged in",
                success: false,
            };
        }

        // Validate userId
        if (!userId || typeof userId !== 'string') {
            return {
                errorMessage: "Invalid user ID",
                success: false,
            };
        }

        // Check if user is supervisor (only supervisor can demote)
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (userData?.role !== "supervisor") {
            return {
                errorMessage: "Unauthorized",
                success: false,
            };
        }

        // Don't allow demoting self
        if (userId === user.id) {
            return {
                errorMessage: "You cannot demote yourself",
                success: false,
            };
        }

        // Check if the user being demoted is actually an admin
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!targetUser) {
            return {
                errorMessage: "User not found",
                success: false,
            };
        }

        if (targetUser.role !== "admin") {
            return {
                errorMessage: "User is not an admin",
                success: false,
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role: "user" },
        });

        return { errorMessage: null, success: true };
    } catch (error) {
        return { errorMessage: "Failed to demote user", success: false };
    }
};

export const updateUserActivityAction = async () => {
    try {
        const user = await getUser();
        if (!user) {
            return { errorMessage: "You must be logged in" };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
        });

        return { errorMessage: null };
    } catch (error) {
        return handleError(error);
    }
};

export const blockUserAction = async (userId: string) => {
    try {
        const user = await getUser();
        if (!user) {
            return {
                errorMessage: "You must be logged in",
                success: false,
            };
        }

        // Validate userId
        if (!userId || typeof userId !== 'string') {
            return {
                errorMessage: "Invalid user ID",
                success: false,
            };
        }

        // Check if user is supervisor (only supervisor can block)
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (userData?.role !== "supervisor") {
            return {
                errorMessage: "Unauthorized",
                success: false,
            };
        }

        // Don't allow blocking self
        if (userId === user.id) {
            return {
                errorMessage: "You cannot block yourself",
                success: false,
            };
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!targetUser) {
            return {
                errorMessage: "User not found",
                success: false,
            };
        }

        // Don't allow blocking supervisors
        if (targetUser.role === "supervisor") {
            return {
                errorMessage: "Cannot block supervisors",
                success: false,
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { blocked: true },
        });

        return { errorMessage: null, success: true };
    } catch (error) {
        return { errorMessage: "Failed to block user", success: false };
    }
};

export const unblockUserAction = async (userId: string) => {
    try {
        const user = await getUser();
        if (!user) {
            return {
                errorMessage: "You must be logged in",
                success: false,
            };
        }

        // Validate userId
        if (!userId || typeof userId !== 'string') {
            return {
                errorMessage: "Invalid user ID",
                success: false,
            };
        }

        // Check if user is supervisor (only supervisor can unblock)
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (userData?.role !== "supervisor") {
            return {
                errorMessage: "Unauthorized",
                success: false,
            };
        }

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, blocked: true },
        });

        if (!targetUser) {
            return {
                errorMessage: "User not found",
                success: false,
            };
        }

        if (!targetUser.blocked) {
            return {
                errorMessage: "User is not blocked",
                success: false,
            };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { blocked: false },
        });

        return { errorMessage: null, success: true };
    } catch (error) {
        return { errorMessage: "Failed to unblock user", success: false };
    }
};

export const deleteAccountAction = async (password: string) => {
    try {
        const user = await requireAuth();
        const userId = user.id;
        const userEmail = user.email;
        
        if (!userEmail) {
            return { errorMessage: "User email not found", success: false };
        }
        
        // Validate password
        const passwordValidation = validateInput(passwordSchema, password);
        if (!passwordValidation.success) {
            return { errorMessage: "Invalid password", success: false };
        }

        // Verify password by attempting to sign in with a temporary client
        // We create a new client to avoid affecting the current session
        const { createClient: createTempClient } = await import('@supabase/supabase-js');
        const tempClient = createTempClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { error: signInError } = await tempClient.auth.signInWithPassword({
            email: userEmail,
            password: passwordValidation.data,
        });

        if (signInError) {
            return { errorMessage: "Invalid password. Please try again.", success: false };
        }

        // Password is correct, proceed with deletion
        // Use a transaction to ensure all deletions happen atomically
        await prisma.$transaction(async (tx) => {
            // Get user with all relationships
            const userWithRelations = await tx.user.findUnique({
                where: { id: userId },
                include: {
                    collaboratedNotes: {
                        select: { id: true },
                    },
                },
            });

            if (!userWithRelations) {
                throw new Error("User not found");
            }

            // Remove user from all collaborated notes (many-to-many relationship)
            if (userWithRelations.collaboratedNotes.length > 0) {
                for (const note of userWithRelations.collaboratedNotes) {
                    await tx.note.update({
                        where: { id: note.id },
                        data: {
                            collaborators: {
                                disconnect: { id: userId },
                            },
                        },
                    });
                }
            }

            // Delete the user
            // Cascade will automatically delete:
            // - Notes (authorId has onDelete: Cascade)
            // - Reviews (userId has onDelete: Cascade)
            // - ReviewReplies (userId has onDelete: Cascade)
            // - CollaborationInvites (senderId and receiverId have onDelete: Cascade)
            // - SupportTickets (userId has onDelete: Cascade, handledById will be set to null)
            await tx.user.delete({
                where: { id: userId },
            });
        });

        // Try to delete from Supabase Auth using service role if available
        // Note: This requires SUPABASE_SERVICE_ROLE_KEY in environment variables
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const { createClient: createAdminClient } = await import('@supabase/supabase-js');
                const adminClient = createAdminClient(
                    process.env.SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false,
                        },
                    }
                );

                const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
                if (deleteError) {
                    console.error("Failed to delete user from Supabase Auth:", deleteError);
                    // Don't fail - database deletion succeeded
                }
            } catch (adminError) {
                console.error("Error deleting user from Supabase Auth:", adminError);
                // Don't fail - database deletion succeeded
            }
        } else {
            // Service role key not available, log a warning
            console.warn("SUPABASE_SERVICE_ROLE_KEY not set. User deleted from database but may still exist in Supabase Auth.");
        }

        // Sign out the user from the current session
        const { auth } = await createClient();
        await auth.signOut();

        return { errorMessage: null, success: true };
    } catch (error: any) {
        console.error("Error deleting account:", error);
        
        // Check for specific error types
        if (error?.code === 'P2025') {
            return { errorMessage: "User not found", success: false };
        }
        
        return { errorMessage: error?.message || "Failed to delete account. Please try again.", success: false };
    }
};