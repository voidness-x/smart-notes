# Documentation: src/app/api/create-new-note/route.ts

## Overview
This is a Next.js API route that creates a new note for an authenticated user. It's called by the middleware when a user visits `/notes` without a noteId.

## Purpose in Project
This API route:
- Creates new notes automatically
- Ensures user exists in database
- Validates authentication
- Returns note ID for redirect

## Route Handler

### `POST /api/create-new-note?userId=USER_ID`

**Purpose**: Creates a new note for the specified user.

**Logic Flow**:
1. Extracts `userId` from query parameters
2. Validates `userId` as UUID format
3. Creates Supabase client
4. Verifies authentication:
   - Gets user from Supabase Auth
   - Verifies userId matches authenticated user
5. Ensures user exists in database:
   - Checks if user exists
   - If not, creates user record
   - Handles race conditions (multiple simultaneous creates)
6. Creates new note:
   - Author: current user
   - Text: empty string
   - Title: "No title"
7. Returns note ID

**Error Handling**:
- Invalid userId → 400 Bad Request
- Unauthorized → 401 Unauthorized
- Database errors → 500 Internal Server Error
- Generic errors → 500 with generic message

---

## Security

### Authentication Verification
- Validates user is authenticated
- Verifies userId matches authenticated user
- Prevents creating notes for other users

### Input Validation
- UUID format validation
- Prevents SQL injection
- Prevents invalid database queries

### Error Messages
- Generic error messages (doesn't expose internals)
- Consistent error format

---

## Dependencies

### Internal Dependencies
- `@/db/prisma` - Database client
- `@/auth/server` - Authentication
- `@/lib/security` - UUID validation

### External Dependencies
- `next/server` - Next.js API route utilities

## Usage

### Called By
- `middleware.ts` - When user has no notes
- Can be called directly (with proper auth)

### Request Format
```
POST /api/create-new-note?userId=USER_UUID
Headers: Cookie (for authentication)
```

### Response Format
```json
{
  "noteId": "uuid-string" | null,
  "error": "error-message" | null
}
```

## Database Operations

### User Creation
- Handles race conditions (P2002 error)
- Creates user if missing
- Links to Supabase Auth user

### Note Creation
- Creates note with default values
- Links to user as author
- Returns generated note ID

## Error Scenarios

### Invalid User ID
- Status: 400
- Response: `{ error: "Invalid userId", noteId: null }`

### Unauthorized
- Status: 401
- Response: `{ error: "Unauthorized", noteId: null }`

### Database Error
- Status: 500
- Response: `{ error: "Failed to create note", noteId: null }`

## Testing Considerations

- Test with valid authenticated user
- Test with invalid userId format
- Test with unauthenticated request
- Test with wrong userId (not matching auth)
- Test user creation race condition
- Test database errors

## Integration

### Middleware Integration
```typescript
const createResponse = await fetch(`${baseUrl}/api/create-new-note?userId=${user.id}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", 'Cookie': cookieHeader },
});
```

## Future Enhancements

Potential improvements:
- Note templates
- Default note content
- Note categories
- Bulk note creation

