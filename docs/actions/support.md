# Documentation: src/actions/support.ts

## Overview
This file contains all server actions related to the support ticket system. It handles ticket creation, retrieval, assignment, status updates, and statistics.

## Purpose in Project
This file manages the customer support system that allows:
- Users to create support tickets
- Admins/supervisors to manage tickets
- Ticket assignment and status tracking
- User satisfaction feedback

## Key Functions

### Ticket Creation

#### `createSupportTicketAction(email, title, description, photoUrl?)`
**Purpose**: Creates a new support ticket.

**Logic Flow**:
1. Requires authentication
2. Validates email format
3. Validates title (3-200 chars)
4. Validates description (10-5000 chars)
5. Validates photo if provided:
   - Max 5MB (base64 length check)
   - Must be data URL (starts with "data:image/")
6. Creates ticket with:
   - User ID
   - Email, title, description
   - Photo URL (truncated to 5MB if needed)
   - Status: "sent"
7. Returns ticket object

**Photo Handling**:
- Base64 data URLs stored directly
- Size limited to 5MB
- Validates image format

**Integration**: Used by `SupportPageClient.tsx` component.

---

### Ticket Retrieval

#### `getMySupportTicketsAction()`
**Purpose**: Retrieves all tickets for the current user.

**Logic Flow**:
1. Requires authentication
2. Fetches tickets where `userId` matches current user
3. Orders by creation date (newest first)
4. Includes handler information (if assigned)
5. Returns ticket list

**Integration**: Used by `SupportPageClient.tsx` to show user's tickets.

---

#### `getAllSupportTicketsAction()`
**Purpose**: Retrieves all tickets (admin/supervisor only).

**Logic Flow**:
1. Requires admin or supervisor role
2. Fetches all tickets
3. Orders by creation date (newest first)
4. Includes:
   - Ticket creator (user) details
   - Handler (assigned admin/supervisor) details
5. Returns all tickets

**Security**: Only admins and supervisors can access.

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

### Ticket Management

#### `assignTicketAction(ticketId: string)`
**Purpose**: Assigns a ticket to the current admin/supervisor.

**Logic Flow**:
1. Requires admin or supervisor role
2. Updates ticket:
   - Sets `handledById` to current user
   - Sets `handledAt` to current timestamp
   - Sets status to "being_processed"
3. Returns updated ticket

**Integration**: Used by `ControlPageClient.tsx` when admin assigns ticket to themselves.

---

#### `updateTicketStatusAction(ticketId, status, solution?)`
**Purpose**: Updates ticket status and optionally adds a solution.

**Logic Flow**:
1. Requires admin or supervisor role
2. Fetches existing ticket to check handler
3. Updates ticket:
   - Sets new status
   - Adds solution if provided
   - If marking complete and no handler:
     - Assigns to current user
     - Sets handled timestamp
4. Returns updated ticket

**Status Values**:
- "sent" - Initial status
- "being_processed" - Assigned and being worked on
- "complete" - Resolved

**Integration**: Used by `ControlPageClient.tsx` for status updates.

---

#### `submitTicketSatisfactionAction(ticketId, satisfied)`
**Purpose**: Records user satisfaction with ticket resolution.

**Logic Flow**:
1. Requires authentication
2. Verifies ticket exists and belongs to user
3. Verifies ticket status is "complete"
4. Updates ticket `satisfied` field (boolean)
5. Returns success/error status

**Validation**:
- ✅ Ticket exists
- ✅ Ticket belongs to user
- ✅ Ticket is completed

**Integration**: Used by `SupportPageClient.tsx` for satisfaction feedback.

---

#### `getTicketStatsAction()`
**Purpose**: Retrieves statistics about ticket handling (admin/supervisor only).

**Logic Flow**:
1. Requires admin or supervisor role
2. Groups tickets by handler:
   - Only completed tickets
   - Only tickets with handlers
3. Counts tickets per handler
4. Fetches handler user details
5. Returns stats array with handler and count

**Use Case**: Shows how many tickets each admin/supervisor has resolved.

**Integration**: Used by `ControlPageClient.tsx` for statistics display.

---

## Dependencies

### Internal Dependencies
- `@/lib/utils` - Error handling
- `@/db/prisma` - Database client
- `@/lib/validation` - Email, title, description schemas
- `@/lib/helpers` - Auth and role checks

## Data Model

### SupportTicket Schema
- `id` - UUID
- `userId` - Foreign key to User (creator)
- `email` - Contact email
- `title` - Ticket title (3-200 chars)
- `description` - Ticket description (10-5000 chars)
- `photoUrl` - Optional base64 image (max 5MB)
- `status` - "sent" | "being_processed" | "complete"
- `solution` - Optional solution text
- `handledById` - Foreign key to User (assigned admin/supervisor)
- `handledAt` - Timestamp when assigned
- `satisfied` - Boolean (user satisfaction)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## Ticket Lifecycle

```
User creates ticket
  → Status: "sent"
  → Admin assigns to themselves
  → Status: "being_processed"
  → Admin adds solution
  → Status: "complete"
  → User provides satisfaction feedback
```

## Security Considerations

1. **Role-Based Access**: Only admins/supervisors can view all tickets
2. **User Isolation**: Users can only see their own tickets
3. **Input Validation**: All inputs validated
4. **Photo Validation**: Image format and size checked
5. **Satisfaction Validation**: Only ticket owner can submit satisfaction

## Validation Rules

### Title
- Min: 3 characters
- Max: 200 characters
- Trimmed

### Description
- Min: 10 characters
- Max: 5000 characters
- Trimmed

### Photo
- Max size: 5MB (base64)
- Format: Must be data URL starting with "data:image/"

## Error Handling

All functions return consistent format:
```typescript
{ errorMessage: string | null, success: boolean, ticket?: Ticket }
```

**Common Errors**:
- "Invalid image" - Photo validation failed
- "Unauthorized" - Role check failed
- "Invalid ticket" - Ticket not found or doesn't belong to user

## Common Usage Patterns

### Creating Ticket
```typescript
const result = await createSupportTicketAction(
  email,
  title,
  description,
  photoUrl
);
if (result.success) {
  // Ticket created
}
```

### Getting User Tickets
```typescript
const result = await getMySupportTicketsAction();
// result.tickets contains user's tickets
```

### Updating Status
```typescript
const result = await updateTicketStatusAction(
  ticketId,
  "complete",
  "Solution here"
);
if (result.success) {
  // Status updated
}
```

## Testing Considerations

- Test ticket creation with valid/invalid inputs
- Test photo upload validation
- Test role-based access control
- Test ticket assignment
- Test status transitions
- Test satisfaction submission
- Test statistics calculation
- Test with many tickets (performance)

## Future Enhancements

Potential improvements:
- Ticket categories/priorities
- Email notifications
- Ticket comments/threading
- File attachments (beyond photos)
- Ticket templates
- SLA tracking
- Automated ticket routing

