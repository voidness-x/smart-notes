# Documentation: src/auth/client.ts

## Overview
This file provides a client-side Supabase authentication client. It creates browser-compatible Supabase clients for use in client components.

## Purpose in Project
This file enables:
- Client-side authentication operations
- Browser-compatible Supabase client
- Environment variable validation
- Client component authentication

## Implementation

### `createClient()`

**Purpose**: Creates a Supabase browser client.

**Logic Flow**:
1. Reads environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Validates environment variables exist
3. If missing → Throws descriptive error
4. Creates browser client with `createBrowserClient()`
5. Returns configured client

**Error Handling**:
- Throws error if environment variables missing
- Clear error message guides setup

---

## Dependencies

### External Dependencies
- `@supabase/ssr` - Supabase SSR client factory

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Usage Pattern

### In Client Components
```typescript
import { createClient } from "@/auth/client";

function MyComponent() {
  const supabase = createClient();
  // Use supabase client
}
```

### Browser Client Features
- Works in browser environment
- Handles cookies automatically
- Manages session state
- Provides auth methods

## Security Considerations

1. **Public Keys**: Uses `NEXT_PUBLIC_` prefix (safe to expose)
2. **Row Level Security**: Supabase RLS protects data
3. **Anonymous Key**: Limited permissions via RLS

## Differences from Server Client

### Server Client (`auth/server.ts`)
- Uses `createServerClient()`
- Works in server components
- Manual cookie handling
- Server-side only

### Client Client (`auth/client.ts`)
- Uses `createBrowserClient()`
- Works in client components
- Automatic cookie handling
- Browser-side only

## Testing Considerations

- Test with valid environment variables
- Test with missing environment variables
- Test client creation
- Test in different browsers

## Future Enhancements

Potential improvements:
- Client-side auth helpers
- Session management utilities
- Auth state listeners

