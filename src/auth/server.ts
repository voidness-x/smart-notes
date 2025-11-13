import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("Missing Supabase environment variables:", {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_ANON_KEY,
    });
    throw new Error("Missing Supabase configuration");
  }

  const client = createServerClient (
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Log cookie setting errors in production for debugging
            console.error("Error setting cookies:", error);
          }
        },
      },
    },
  );

return client;
}

export async function getUser() {
    try {
        const {auth} = await createClient();

        const userObject = await auth.getUser()

        if (userObject.error) {
            // Don't log auth errors - they're expected when user is not logged in
            return null
        }

        return userObject.data.user;
    } catch (error) {
        // Silently handle any errors (e.g., missing session, cookie issues)
        // This prevents the app from crashing when checking auth status
        return null;
    }
}