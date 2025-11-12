# Documentation: src/app/api/fetch-newest-note/route.ts

## Overview
This is a Next.js API route that retrieves the newest note ID for an authenticated user. It's called by the middleware to automatically select a note when user visits `/notes`.

## Purpose in Project
This API route:
- Finds user's most recently created note
- Returns note ID for redirect
- Validates authentication
- Handles users with no notes

## Route Handler

### `GET /api/fetch-newest-note?userId=USER_ID`

**Purpose**: Retrieves the ID of the user's newest note.

**Logic Flow**:
1. Extracts `userId` from query parameters
2. Validates `userId` as UUID format
3. Creates Supabase client
4. Verifies authentication:
   - Gets user from Supabase Auth
   - Verifies userId matches authenticated user
5. Queries database:
   - Finds first note where `authorId` matches
   - Orders by `createdAt` descending (newest first)
   - Selects only `id` field (minimal data)
6. Returns note ID or null

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
- Prevents querying other users' notes

### Input Validation
- UUID format validation
- Prevents SQL injection
- Prevents invalid queries

### Privacy
- Only returns note ID (not content)
- Only returns user's own notes
- Returns null if no notes (doesn't error)

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
- `middleware.ts` - When user visits `/notes` without noteId

### Request Format
```
GET /api/fetch-newest-note?userId=USER_UUID
Headers: Cookie (for authentication)
```

### Response Format
```json
{
  "newestNoteId": "uuid-string" | null,
  "error": "error-message" | null
}
```

## Database Query

### Query Details
```typescript
prisma.note.findFirst({
  where: { authorId: userId },
  orderBy: { createdAt: "desc" },
  select: { id: true },
})
```

**Optimization**:
- Uses `findFirst` (stops after first match)
- Orders by `createdAt` descending
- Only selects `id` field (minimal data transfer)

## Error Scenarios

### Invalid User ID
- Status: 400
- Response: `{ error: "Invalid userId", newestNoteId: null }`

### Unauthorized
- Status: 401
- Response: `{ error: "Unauthorized", newestNoteId: null }`

### Database Error
- Status: 500
- Response: `{ error: "Failed to fetch newest note", newestNoteId: null }`

### No Notes
- Status: 200
- Response: `{ newestNoteId: null }` (not an error)

## Integration

### Middleware Integration
```typescript
const fetchResponse = await fetch(`${baseUrl}/api/fetch-newest-note?userId=${user.id}`, {
  headers: { 'Cookie': cookieHeader },
});
```

## Performance Considerations

1. **Minimal Data**: Only fetches note ID
2. **Efficient Query**: Uses indexed `authorId` and `createdAt`
3. **Single Query**: One database call

## Testing Considerations

- Test with user who has notes
- Test with user who has no notes
- Test with invalid userId
- Test with unauthenticated request
- Test with wrong userId
- Test database errors

## Future Enhancements

Potential improvements:
- Return multiple newest notes
- Filter by note type/category
- Cache results
- Return note metadata (title, updated date)

