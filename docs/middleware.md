# Documentation: src/middleware.ts

## Overview
This file implements Next.js middleware that runs on every request. It handles session management, authentication redirects, and automatic note creation/selection.

## Purpose in Project
This middleware:
- Manages Supabase authentication sessions
- Redirects authenticated users away from auth pages
- Automatically selects/creates notes for users
- Handles cookie management for Supabase

## Key Functions

### Main Middleware

#### `middleware(request: NextRequest)`
**Purpose**: Entry point for Next.js middleware.

**Logic Flow**:
1. Calls `updateSession()` for all requests
2. Returns response

**Config**: Matches all routes except static assets and images.

---

### Session Management

#### `updateSession(request: NextRequest)`
**Purpose**: Updates Supabase session and handles route-specific logic.

**Logic Flow**:

**1. Create Supabase Client**:
- Creates server client with cookie handlers
- Configures cookie get/set operations
- Maintains session across requests

**2. Auth Route Handling**:
- Checks if route is `/login` or `/sign-up`
- If user is already authenticated → redirects to `/notes`
- Prevents logged-in users from accessing auth pages

**3. Notes Page Auto-Note Selection**:
- If on `/notes` without `noteId` parameter:
  - Fetches user's newest note
  - If note exists → redirects to note
  - If no note → creates new note → redirects to it
- Uses internal API routes for note operations

**4. Return Response**:
- Returns NextResponse with updated cookies
- Maintains session state

---

## Route Matching

### Matcher Configuration
```typescript
matcher: [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
]
```

**What It Matches**:
- All routes EXCEPT:
  - `_next/static` - Next.js static files
  - `_next/image` - Next.js image optimization
  - `favicon.ico` - Favicon
  - Image files (svg, png, jpg, jpeg, gif, webp)

**Why**: Prevents middleware from running on static assets (performance).

---

## Cookie Management

### Supabase Cookie Handler
The middleware implements custom cookie handlers for Supabase SSR:

**getAll()**: Reads cookies from request
**setAll()**: Sets cookies in both request and response

**Why Needed**: 
- Supabase SSR requires cookie management
- Next.js middleware needs to handle cookies properly
- Maintains session across server/client boundary

---

## Authentication Flow

### Auth Route Protection
```
User visits /login or /sign-up
  → Middleware checks if authenticated
  → If authenticated → Redirect to /notes
  → If not authenticated → Allow access
```

### Notes Page Auto-Selection
```
User visits /notes (no noteId)
  → Middleware checks authentication
  → If authenticated:
    → Try to fetch newest note
    → If found → Redirect to /notes?noteId=NEWEST
    → If not found → Create new note → Redirect to /notes?noteId=NEW
  → If not authenticated → Allow access (will redirect at page level)
```

---

## API Route Calls

The middleware makes internal API calls:
- `/api/fetch-newest-note?userId=USER_ID`
- `/api/create-new-note?userId=USER_ID`

**Why Internal API?**
- Reuses existing logic
- Maintains consistency
- Handles authentication properly

**Cookie Forwarding**: Forwards cookies to API routes to maintain session.

---

## Dependencies

### External Dependencies
- `@supabase/ssr` - Supabase SSR client
- `next/server` - Next.js server utilities

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_BASE_URL` - Application base URL

## Error Handling

### Silent Failures
- API calls wrapped in try-catch
- Failures don't crash middleware
- Falls back to default behavior

**Rationale**: Middleware should never break the application.

---

## Performance Considerations

### Static Asset Exclusion
- Middleware doesn't run on static files
- Reduces unnecessary processing
- Improves performance

### Efficient Cookie Handling
- Only processes cookies when needed
- Minimal overhead for static routes

---

## Security Considerations

1. **Session Management**: Secure cookie handling
2. **Authentication Checks**: Validates user before redirects
3. **Internal API Calls**: Uses authenticated requests
4. **Error Handling**: Doesn't expose internal errors

## Common Scenarios

### Scenario 1: Logged-in User Visits Login
```
Request: GET /login
  → Middleware detects user is authenticated
  → Redirects to /notes
```

### Scenario 2: User Visits Notes Without NoteId
```
Request: GET /notes
  → Middleware detects no noteId
  → Fetches newest note
  → Redirects to /notes?noteId=NEWEST
```

### Scenario 3: New User (No Notes)
```
Request: GET /notes
  → Middleware detects no noteId
  → Tries to fetch newest note (none found)
  → Creates new note
  → Redirects to /notes?noteId=NEW
```

## Testing Considerations

- Test auth route redirects
- Test note auto-selection
- Test note creation
- Test cookie handling
- Test error scenarios
- Test with different user states

## Future Enhancements

Potential improvements:
- Rate limiting
- Request logging
- Analytics tracking
- A/B testing support
- Feature flag checks

