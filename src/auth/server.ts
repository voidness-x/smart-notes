import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('Authentication configuration is incomplete.')
      return createServerClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_ANON_KEY || '',
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // ignore cookie set failures in incomplete local config
              }
            },
          },
        },
      )
    }

    const client = createServerClient(
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
              )
            } catch {
              // ignore cookie set failures
            }
          },
        },
      },
    )

    return client
  } catch {
    const cookieStore = await cookies()
    return createServerClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // silently fail if the auth client cannot be created
          },
        },
      },
    )
  }
}

export const getUser = cache(async () => {
  try {
    const { auth } = await createClient()
    const userObject = await auth.getUser()

    if (userObject.error) {
      return null
    }

    return userObject.data.user
  } catch {
    return null
  }
})
