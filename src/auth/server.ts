import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  try {
  const cookieStore = await cookies()

    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables:", {
        hasUrl: !!process.env.SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_ANON_KEY,
      });
      // Return a client with invalid config - the actual API calls will fail gracefully
      // This prevents throwing errors that break server component rendering
      return createServerClient(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_ANON_KEY || "",
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
                console.error("Error setting cookies:", error);
              }
            },
          },
        },
    );
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
  } catch (error) {
    // If creating client fails, log and return a minimal client
    // This prevents server component render errors
    console.error("Error creating Supabase client:", error);
    const cookieStore = await cookies();
    return createServerClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Silently fail if cookies can't be set
          },
        },
      },
    );
  }
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