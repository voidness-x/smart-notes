# Documentation: src/actions/collaboration.ts

## Overview
This file contains all server actions related to note collaboration features. It handles inviting users to collaborate on notes, managing collaboration invites, and controlling collaboration settings.

## Purpose in Project
This file enables the collaboration feature that allows:
- Multiple users to work on the same note
- Inviting users via link or direct user ID
- Managing collaboration invites (accept, reject)
- Toggling collaboration on/off for notes

## Key Functions

### Collaboration Management

#### `toggleCollaborationAction(noteId: string, isCollaborative: boolean)`
**Purpose**: Enables or disables collaboration on a note.

**Logic Flow**:
1. Validates note access (user must be author or collaborator)
2. Verifies user is the author (only author can toggle)
3. If disabling collaboration:
   - Removes all collaborators from the note
   - Sets `isCollaborative: false`
4. If enabling collaboration:
   - Sets `isCollaborative: true`
5. Returns success/error status

**Security**: Only note authors can toggle collaboration.

**Integration**: Used by `CollabButton.tsx` component.

**Database Impact**: When disabling, all collaborator relationships are removed.

---

#### `createInviteLinkAction(noteId: string)`
**Purpose**: Creates a shareable invite link for a note.

**Logic Flow**:
1. Validates note access
2. Verifies user is the author
3. Generates secure random token (32 bytes = 64 hex characters)
4. Sets expiration date (7 days from now)
5. Creates `CollaborationInvite` record with:
   - Note ID
   - Sender ID (current user)
   - Invite token
   - Expiration date
   - Status: "pending"
   - No receiverId (public link)
6. Constructs invite URL: `${baseUrl}/notes?invite=${token}`
7. Returns invite link

**Token Generation**: Uses Node.js `crypto.randomBytes()` for cryptographically secure random tokens.

**Expiration**: Invites expire after 7 days.

**Integration**: Used by `CollabButton.tsx` when user clicks "Create Invite Link".

---

#### `sendInviteByUserIdAction(noteId: string, receiverId: string)`
**Purpose**: Sends a collaboration invite directly to a specific user.

**Logic Flow**:
1. Validates note access
2. Validates receiverId as UUID
3. Prevents self-invitation
4. Verifies user is the author
5. Verifies receiver user exists
6. Checks if user is already a collaborator
7. Checks if pending invite already exists
8. Generates invite token
9. Sets expiration (7 days)
10. Creates invite with receiverId specified
11. Returns success/error status

**Validation Checks**:
- ✅ Receiver ID is valid UUID
- ✅ User is not inviting themselves
- ✅ User is note author
- ✅ Receiver exists
- ✅ Receiver is not already collaborator
- ✅ No pending invite exists

**Integration**: Used by `ProfileDialog.tsx` when sending invites to specific users.

---

### Invite Management

#### `getPendingInvitesAction()`
**Purpose**: Retrieves all pending collaboration invites for the current user.

**Logic Flow**:
1. Requires authentication
2. Fetches invites where:
   - `receiverId` matches current user
   - `status` is "pending"
   - `expiresAt` is in the future (not expired)
3. Includes related data:
   - Note details (id, title, text preview)
   - Sender details (id, email, name, avatar)
4. Orders by creation date (newest first)
5. Returns invite list

**Integration**: Used by `ProfileDialog.tsx` to show pending invites.

---

#### `acceptInviteAction(inviteId: string)`
**Purpose**: Accepts a collaboration invite by invite ID.

**Logic Flow**:
1. Requires authentication
2. Validates inviteId as UUID
3. Fetches invite with note details
4. Validates invite:
   - Invite exists
   - Receiver matches current user
   - Status is "pending"
   - Not expired
5. Adds user as collaborator to note
6. Sets note `isCollaborative: true` (if not already)
7. Updates invite status to "accepted"
8. Returns success/error status

**Database Operations**:
- Updates note: Adds collaborator, enables collaboration
- Updates invite: Changes status to "accepted"

**Integration**: Used by `ProfileDialog.tsx` when user accepts an invite.

---

#### `rejectInviteAction(inviteId: string)`
**Purpose**: Rejects a collaboration invite.

**Logic Flow**:
1. Requires authentication
2. Validates inviteId as UUID
3. Fetches invite
4. Validates invite:
   - Invite exists
   - Receiver matches current user
   - Status is "pending"
5. Updates invite status to "rejected"
6. Returns success/error status

**Note**: Rejecting doesn't affect the note or other invites.

**Integration**: Used by `ProfileDialog.tsx` when user rejects an invite.

---

#### `acceptInviteByTokenAction(inviteToken: string)`
**Purpose**: Accepts an invite via token (from invite link).

**Logic Flow**:
1. Requires authentication
2. Validates token format (64 characters)
3. Fetches invite by token with note details
4. Validates invite:
   - Invite exists
   - Status is "pending"
   - Not expired
   - User is not the note author (can't invite yourself)
5. If invite has receiverId:
   - Verifies it matches current user
6. If invite has no receiverId (public link):
   - Updates invite to set receiverId to current user
7. Adds user as collaborator
8. Enables collaboration on note
9. Updates invite status to "accepted"
10. Returns noteId for redirect

**Special Handling**:
- Public links (no receiverId) can be used by any authenticated user
- Private invites (with receiverId) can only be used by that user
- Prevents authors from accepting invites to their own notes

**Integration**: Used by `notes/page.tsx` when user visits invite link.

**URL Pattern**: `/notes?invite=${token}`

---

## Dependencies

### Internal Dependencies
- `@/db/prisma` - Database client
- `@/lib/utils` - Error handling
- `@/lib/validation` - Token validation schema
- `@/lib/security` - UUID validation
- `@/lib/helpers` - Auth and validation helpers

### External Dependencies
- `crypto` - Secure random token generation

## Collaboration Model

### Database Schema
- `Note.isCollaborative` - Boolean flag
- `Note.collaborators` - Many-to-many relation with User
- `CollaborationInvite` - Invite records with:
  - `noteId` - Target note
  - `senderId` - User who sent invite
  - `receiverId` - User invited (nullable for public links)
  - `inviteToken` - Secure token
  - `expiresAt` - Expiration date
  - `status` - "pending" | "accepted" | "rejected"

### Access Control
- **Author**: Can toggle collaboration, create invites, delete note
- **Collaborator**: Can edit note, update title/tags, pin note
- **Collaborator**: Cannot delete note, toggle collaboration, create invites

## Invite Flow Diagrams

### Public Link Flow
```
Author creates invite link
  → Token generated
  → Invite created (no receiverId)
  → Link shared: /notes?invite=TOKEN
  → User visits link
  → acceptInviteByTokenAction called
  → User added as collaborator
  → Redirected to note
```

### Direct Invite Flow
```
Author sends invite to User B
  → sendInviteByUserIdAction called
  → Invite created with receiverId
  → User B sees invite in profile
  → User B accepts
  → acceptInviteAction called
  → User B added as collaborator
```

## Security Considerations

1. **Token Security**: Cryptographically secure random tokens
2. **Expiration**: Invites expire after 7 days
3. **Access Control**: Only authors can create invites
4. **Validation**: All IDs validated as UUIDs
5. **Self-Invitation**: Prevented
6. **Duplicate Invites**: Prevented (checks for existing pending invites)

## Error Handling

All functions follow consistent error handling:
```typescript
try {
  // Validation & business logic
  return { errorMessage: null };
} catch (error) {
  return handleError(error);
}
```

**Common Errors**:
- "You can only toggle collaboration on your own notes"
- "You can only create invites for your own notes"
- "You cannot invite yourself"
- "User is already a collaborator"
- "An invite has already been sent to this user"
- "Invalid or expired invite"

## Performance Considerations

1. **Token Generation**: Fast (crypto.randomBytes)
2. **Database Queries**: Optimized with Prisma select
3. **Expiration Checks**: Database filters expired invites
4. **Duplicate Checks**: Single query to check existing invites

## Common Usage Patterns

### Creating Invite Link
```typescript
const result = await createInviteLinkAction(noteId);
if (!result.errorMessage) {
  // Copy result.inviteLink to clipboard
}
```

### Accepting Invite
```typescript
const result = await acceptInviteAction(inviteId);
if (!result.errorMessage) {
  // Refresh note list
}
```

### Toggling Collaboration
```typescript
const result = await toggleCollaborationAction(noteId, true);
if (!result.errorMessage) {
  // Update UI
}
```

## Testing Considerations

- Test invite creation (link and direct)
- Test invite acceptance/rejection
- Test expired invites
- Test duplicate invite prevention
- Test self-invitation prevention
- Test collaboration toggle
- Test collaborator removal when disabling
- Test access control (author vs collaborator)

## Future Enhancements

Potential improvements:
- Real-time collaboration (WebSockets)
- Collaboration permissions (read-only, edit, etc.)
- Invite notifications
- Collaboration history/audit log
- Bulk invite operations

