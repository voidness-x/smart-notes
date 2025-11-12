# Documentation: src/app/notes/page.tsx

## Overview
This is the main notes page component that displays the note editor and handles note selection, collaboration invites, and note access control.

## Purpose in Project
This page serves as the primary workspace for users:
- Displays the rich text editor
- Handles note selection via URL parameters
- Processes collaboration invite tokens
- Manages note access permissions
- Provides action buttons (AI, New Note, Collaboration)

## Component Structure

### Props
```typescript
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
```
- `searchParams`: Next.js 15 async search params (noteId, invite token)

### Server Component
This is a server component that:
- Fetches data on the server
- Handles authentication
- Processes invite tokens
- Validates note access

## Key Functionality

### Invite Token Processing

**Logic Flow**:
1. Checks if `invite` parameter exists in URL
2. If user is authenticated and invite token exists:
   - Calls `acceptInviteByTokenAction()`
   - If successful, redirects to note
   - If error, continues to normal flow

**Integration**: Handles collaboration invite links like `/notes?invite=TOKEN`

---

### Note Selection and Access Control

**Logic Flow**:
1. Extracts `noteId` from URL parameters
2. If `noteId` exists and user is authenticated:
   - Validates `noteId` as UUID format
   - If invalid → treats as no note (prevents errors)
   - If valid → Fetches note from database
3. Checks note access:
   - User must be author OR collaborator
   - Uses Prisma query with OR condition
4. If note found → passes to editor
5. If note not found → editor shows empty state

**Security**: 
- UUID validation prevents SQL injection
- Access control ensures users only see their notes
- Invalid IDs are handled gracefully

---

### Component Rendering

**Rendered Components**:
1. **Action Buttons** (top right):
   - `CollabButton` - Only shown if user is note author
   - `AskAIButton` - Always shown
   - `NewNoteButton` - Always shown

2. **Note Editor**:
   - `NoteTextInput` - Main editor component
   - Receives:
     - `noteId` - Current note ID
     - `startingNoteText` - Note content
     - `startingTags` - Note tags
     - `startingTitle` - Note title

**Conditional Rendering**:
- Collaboration button only for authors
- Editor shows "No title" if note has no title

---

## Dependencies

### Internal Dependencies
- `@/auth/server` - `getUser()` for authentication
- `@/components/ui/*` - UI components
- `@/db/prisma` - Database client
- `@/actions/collaboration` - Invite acceptance
- `@/lib/security` - UUID validation

### External Dependencies
- `next/navigation` - `redirect()` for navigation

## Data Flow

### Page Load Flow
```
User visits /notes?noteId=ID
  → Server component renders
  → Checks authentication
  → Validates noteId
  → Fetches note from database
  → Checks access permissions
  → Passes data to NoteTextInput
  → Editor displays note content
```

### Invite Flow
```
User visits /notes?invite=TOKEN
  → Server component renders
  → Detects invite token
  → Calls acceptInviteByTokenAction
  → If successful → Redirects to /notes?noteId=NOTE_ID
  → Note editor loads with new note
```

## Security Considerations

1. **UUID Validation**: Prevents invalid queries
2. **Access Control**: Only author/collaborator can access
3. **Authentication**: User must be logged in
4. **Error Handling**: Invalid IDs handled gracefully

## Error Handling

### Invalid Note ID
- UUID validation fails → `note = null`
- Editor shows empty state
- No error thrown (graceful degradation)

### Access Denied
- Note not found in user's notes → `note = null`
- User sees empty editor
- No error message (security - doesn't reveal note existence)

### Invite Errors
- Invite acceptance fails → Continues to normal flow
- User can still use the app

## Integration Points

### Used By
- Next.js routing system
- Middleware (auto-redirects here)

### Uses
- `NoteTextInput` - Main editor
- `CollabButton` - Collaboration controls
- `AskAIButton` - AI features
- `NewNoteButton` - Note creation

## Performance Considerations

1. **Server-Side Rendering**: Data fetched on server
2. **Selective Queries**: Only fetches necessary note fields
3. **UUID Validation**: Prevents unnecessary database queries

## Common Scenarios

### Scenario 1: User Opens Existing Note
```
/notes?noteId=UUID
  → Validates UUID
  → Fetches note
  → Checks access
  → Displays in editor
```

### Scenario 2: User Accepts Invite
```
/notes?invite=TOKEN
  → Accepts invite
  → Redirects to /notes?noteId=UUID
  → Displays note
```

### Scenario 3: Invalid Note ID
```
/notes?noteId=INVALID
  → UUID validation fails
  → note = null
  → Editor shows empty state
```

## Testing Considerations

- Test with valid note IDs
- Test with invalid note IDs
- Test invite token processing
- Test access control (author vs collaborator)
- Test with no note ID
- Test authentication states

## Future Enhancements

Potential improvements:
- Note preview mode
- Multiple note tabs
- Note history/versioning
- Real-time collaboration indicators

