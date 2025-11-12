# Documentation: src/auth/server.ts

## Overview
This file provides server-side Supabase authentication utilities. It creates authenticated Supabase clients and retrieves user information for server components and server actions.

## Purpose in Project
This file is the foundation for all server-side authentication:
- Creates Supabase clients with proper cookie handling
- Retrieves authenticated users
- Manages server-side sessions

## Key Functions

### Client Creation

#### `createClient()`
**Purpose**: Creates a Supabase server client with Next.js cookie integration.

**Logic Flow**:
1. Gets Next.js cookie store
2. Creates Supabase SSR client with:
   - Supabase URL from environment
   - Anonymous key from environment
   - Custom cookie handlers:
     - `getAll()`: Reads from Next.js cookie store
     - `setAll()`: Writes to Next.js cookie store (with error handling)
3. Returns Supabase client

**Cookie Handling**:
- Reads cookies from Next.js `cookies()` API
- Writes cookies back to Next.js cookie store
- Handles errors silently (prevents crashes)

**Why SSR Client?**
- Works in server components
- Handles cookies properly
- Maintains session across requests

**Integration**: Used by all server actions and server components that need authentication.

---

### User Retrieval

#### `getUser()`
**Purpose**: Retrieves the currently authenticated user.

**Logic Flow**:
1. Creates Supabase client
2. Calls `auth.getUser()` to get user from session
3. If error (user not authenticated):
   - Returns `null` (doesn't throw)
   - Silently handles (expected case)
4. If success:
   - Returns user object
5. Catches any errors and returns `null`

**Return Type**: `User | null`

**Error Handling**:
- Returns `null` on any error
- Doesn't log errors (expected when not logged in)
- Prevents app crashes from auth issues

**Why Silent Errors?**
- Not being logged in is a normal state
- Logging would create noise
- Prevents information leakage

**Integration**: Used throughout the application to check authentication status.

---

## Dependencies

### External Dependencies
- `@supabase/ssr` - Supabase SSR client
- `next/headers` - Next.js cookie API

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## Design Patterns

### Fail-Safe Authentication
Both functions handle errors gracefully:
- Return `null` instead of throwing
- Don't log expected errors
- Prevent crashes

### Cookie Integration
Proper Next.js 13+ App Router cookie handling:
- Uses `cookies()` API
- Handles cookie setting errors
- Maintains session state

## Usage Patterns

### In Server Actions
```typescript
import { getUser } from "@/auth/server";

export const someAction = async () => {
  const user = await getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  // Use user
};
```

### In Server Components
```typescript
import { getUser } from "@/auth/server";

export default async function SomePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  // Render with user
};
```

### Creating Client for Auth Operations
```typescript
import { createClient } from "@/auth/server";

export const loginAction = async (email: string, password: string) => {
  const { auth } = await createClient();
  const { data, error } = await auth.signInWithPassword({
    email,
    password,
  });
  // Handle response
};
```

## Security Considerations

1. **Environment Variables**: Sensitive keys from environment
2. **Cookie Security**: Handled by Supabase and Next.js
3. **Error Handling**: Doesn't expose internal errors
4. **Session Management**: Secure session handling via Supabase

## Error Scenarios

### User Not Authenticated
- `getUser()` returns `null`
- Expected behavior, not an error
- Components/actions handle accordingly

### Cookie Issues
- Handled silently
- Returns `null` for user
- App continues to function

### Network Issues
- Handled in try-catch
- Returns `null`
- Prevents crashes

## Testing Considerations

- Test with authenticated users
- Test with unauthenticated users
- Test cookie handling
- Test error scenarios
- Test session persistence

## Integration Points

### Used By
- All server actions (via `getUser()`)
- All server components (via `getUser()`)
- Authentication actions (via `createClient()`)

### Supabase Integration
- Uses Supabase Auth for authentication
- Uses Supabase SSR for cookie management
- Integrates with Next.js App Router

## Future Enhancements

Potential improvements:
- Session refresh handling
- Token refresh logic
- Multi-factor authentication support
- Session timeout handling

