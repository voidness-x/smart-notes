# Database Schema Documentation

## Overview
This document provides a comprehensive explanation of the Smart Notes database schema. The database uses PostgreSQL and is managed through Prisma ORM. The schema supports user authentication, note-taking, collaboration, reviews, and support ticket management.

## Database Configuration

### Provider
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Connection**: Uses `DATABASE_URL` and `DIRECT_URL` environment variables

### Generator
- **Client**: `prisma-client-js`
- **Purpose**: Generates TypeScript types and database client

---

## Schema Models

### 1. User Model

**Purpose**: Stores all user account information and authentication data.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique user identifier, matches Supabase Auth user ID |
| `email` | String | Unique, Required | User's email address (unique across all users) |
| `name` | String? | Optional | User's display name (can be null) |
| `createdAt` | DateTime | Default: `now()` | Account creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last account update timestamp |
| `avatarUrl` | String? | Optional | URL to user's profile picture |
| `role` | String | Default: `"user"` | User role: `"user"`, `"admin"`, or `"supervisor"` |
| `lastActiveAt` | DateTime? | Optional, Default: `now()` | Last activity timestamp (for tracking) |
| `blocked` | Boolean | Default: `false` | Whether user is blocked from accessing the application |

#### Relationships

- **`posts`** (One-to-Many): User's authored notes (`Note.authorId`)
- **`collaboratedNotes`** (Many-to-Many): Notes user collaborates on
- **`sentInvites`** (One-to-Many): Collaboration invites sent by user
- **`receivedInvites`** (One-to-Many): Collaboration invites received by user
- **`reviews`** (One-to-Many): Reviews written by user
- **`reviewReplies`** (One-to-Many): Replies to reviews written by user
- **`supportTickets`** (One-to-Many): Support tickets created by user
- **`handledTickets`** (One-to-Many): Support tickets handled by user (admin/supervisor)

#### Indexes

- **`role`**: Indexed for fast role-based queries
- **`blocked`**: Indexed for filtering blocked users

#### Business Logic

**Role System**:
- **`user`**: Standard user, can create notes, collaborate, leave reviews
- **`admin`**: Can manage users, handle support tickets, delete reviews
- **`supervisor`**: Can promote/demote admins, block users, handle tickets

**Blocking Mechanism**:
- When `blocked = true`, user is redirected to `/blocked` page
- Blocked users cannot access any features
- Only supervisors can block/unblock users

**Activity Tracking**:
- `lastActiveAt` updated on user actions
- Used for analytics and user engagement tracking

---

### 2. Note Model

**Purpose**: Core model storing all note content, metadata, and collaboration settings.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique note identifier |
| `text` | String | Required | Note content (HTML format, max 5MB) |
| `authorId` | String | Required, Foreign Key | ID of note author (references User) |
| `createdAt` | DateTime | Default: `now()` | Note creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last note update timestamp |
| `pinned` | Boolean | Default: `false` | Whether note is pinned (shows at top) |
| `tags` | String[] | Default: `[]` | Array of tag strings (max 20, each max 50 chars) |
| `title` | String? | Optional, Default: `""` | Note title (max 500 chars, defaults to "No title") |
| `isCollaborative` | Boolean | Default: `false` | Whether note allows collaboration |

#### Relationships

- **`author`** (Many-to-One): User who created the note (`User.posts`)
- **`collaborators`** (Many-to-Many): Users who can edit this note (`User.collaboratedNotes`)
- **`invites`** (One-to-Many): Collaboration invites for this note

#### Cascade Behavior

- **On User Delete**: If author is deleted, all their notes are deleted (`onDelete: Cascade`)
- **On Collaborator Remove**: Collaborators can be removed without deleting note

#### Business Logic

**Access Control**:
- **Author**: Full access (edit, delete, toggle collaboration, create invites)
- **Collaborator**: Can edit content, title, tags, pin note (cannot delete or manage collaboration)

**Pinning**:
- Pinned notes appear at top of sidebar
- Users can pin/unpin their own notes or collaborated notes

**Tags**:
- Stored as array of strings
- Normalized to lowercase
- Used for filtering and search
- Max 20 tags per note

**Collaboration**:
- When `isCollaborative = true`, note can have collaborators
- When `isCollaborative = false`, all collaborators are removed
- Only author can toggle collaboration

**Content Storage**:
- Text stored as HTML string
- Supports rich text formatting
- Max size: 5,000,000 characters (~5MB)

---

### 3. CollaborationInvite Model

**Purpose**: Manages collaboration invitations between users for notes.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique invite identifier |
| `noteId` | String | Required, Foreign Key | Note being shared (references Note) |
| `senderId` | String | Required, Foreign Key | User sending invite (references User) |
| `receiverId` | String? | Optional, Foreign Key | User receiving invite (null for public links) |
| `inviteToken` | String | Unique, Required | Secure token for invite link (64 hex chars) |
| `status` | String | Default: `"pending"` | Status: `"pending"`, `"accepted"`, `"rejected"`, `"expired"` |
| `createdAt` | DateTime | Default: `now()` | Invite creation timestamp |
| `expiresAt` | DateTime | Required | Invite expiration date (typically 7 days) |

#### Relationships

- **`note`** (Many-to-One): Note being shared (`Note.invites`)
- **`sender`** (Many-to-One): User who sent invite (`User.sentInvites`)
- **`receiver`** (Many-to-One, Optional): User who received invite (`User.receivedInvites`)

#### Indexes

- **`receiverId`**: Fast lookup of user's pending invites
- **`inviteToken`**: Fast lookup by token (for public links)
- **`status`**: Fast filtering by status

#### Cascade Behavior

- **On Note Delete**: All invites deleted (`onDelete: Cascade`)
- **On Sender Delete**: All sent invites deleted (`onDelete: Cascade`)
- **On Receiver Delete**: All received invites deleted (`onDelete: Cascade`)

#### Business Logic

**Invite Types**:
1. **Direct Invite** (`receiverId` set): Sent to specific user
2. **Public Link** (`receiverId` null): Shareable link, any authenticated user can accept

**Invite Flow**:
1. Author creates invite → Status: `"pending"`
2. User accepts → Status: `"accepted"`, user added as collaborator
3. User rejects → Status: `"rejected"`
4. Invite expires → Status: `"expired"` (checked on access)

**Token Security**:
- 32 random bytes = 64 hex characters
- Cryptographically secure
- Unique across all invites
- Used in URL: `/notes?invite=TOKEN`

**Expiration**:
- Default: 7 days from creation
- Expired invites cannot be accepted
- Status checked on access attempt

---

### 4. Review Model

**Purpose**: Stores user reviews and ratings of the application.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique review identifier |
| `userId` | String | Required, Foreign Key | User who wrote review (references User) |
| `rating` | Int | Required | Star rating (1-5) |
| `comment` | String? | Optional | Review comment (max 5000 chars, sanitized HTML) |
| `createdAt` | DateTime | Default: `now()` | Review creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last review update timestamp |

#### Relationships

- **`user`** (Many-to-One): User who wrote review (`User.reviews`)
- **`replies`** (One-to-Many): Replies to this review

#### Indexes

- **`userId`**: Fast lookup of user's review (one review per user)
- **`createdAt`**: Fast sorting by date (newest first)

#### Cascade Behavior

- **On User Delete**: Review deleted (`onDelete: Cascade`)
- **On Review Delete**: All replies deleted (cascade)

#### Business Logic

**One Review Per User**:
- Users can only have one review
- Updating review replaces existing one
- Prevents review spam

**Rating System**:
- 1-5 stars (integer)
- Required field
- Used for average rating calculation

**Comment**:
- Optional text field
- HTML sanitized before storage
- Max 5000 characters
- Supports rich text formatting

**Moderation**:
- Only supervisors/admins can delete reviews
- Users can update their own review
- Replies can be added by any authenticated user

---

### 5. ReviewReply Model

**Purpose**: Stores replies to reviews, enabling discussion threads.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique reply identifier |
| `reviewId` | String | Required, Foreign Key | Review being replied to (references Review) |
| `userId` | String | Required, Foreign Key | User who wrote reply (references User) |
| `comment` | String | Required | Reply comment (max 5000 chars, sanitized HTML) |
| `createdAt` | DateTime | Default: `now()` | Reply creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last reply update timestamp |

#### Relationships

- **`review`** (Many-to-One): Review being replied to (`Review.replies`)
- **`user`** (Many-to-One): User who wrote reply (`User.reviewReplies`)

#### Indexes

- **`reviewId`**: Fast lookup of all replies for a review
- **`userId`**: Fast lookup of user's replies

#### Cascade Behavior

- **On Review Delete**: All replies deleted (`onDelete: Cascade`)
- **On User Delete**: User's replies deleted (`onDelete: Cascade`)

#### Business Logic

**Multiple Replies**:
- Multiple users can reply to same review
- Replies ordered by `createdAt` (oldest first)
- Creates discussion threads

**Comment**:
- Required text field
- HTML sanitized before storage
- Max 5000 characters
- Supports rich text formatting

---

### 6. SupportTicket Model

**Purpose**: Manages customer support tickets and their resolution.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Primary Key, Default: `uuid()` | Unique ticket identifier |
| `userId` | String | Required, Foreign Key | User who created ticket (references User) |
| `email` | String | Required | Contact email for ticket |
| `title` | String | Required | Ticket title (3-200 chars) |
| `description` | String | Required | Ticket description (10-5000 chars) |
| `photoUrl` | String? | Optional | Base64 image (max 5MB) |
| `status` | String | Default: `"sent"` | Status: `"sent"`, `"being_processed"`, `"complete"` |
| `handledById` | String? | Optional, Foreign Key | Admin/supervisor handling ticket |
| `handledAt` | DateTime? | Optional | When ticket was assigned |
| `solution` | String? | Optional | Solution/reply from admin/supervisor |
| `createdAt` | DateTime | Default: `now()` | Ticket creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last ticket update timestamp |
| `satisfied` | Boolean? | Optional | User satisfaction: `null` (not asked), `true` (yes), `false` (no) |

#### Relationships

- **`user`** (Many-to-One): User who created ticket (`User.supportTickets`)
- **`handledBy`** (Many-to-One, Optional): Admin/supervisor handling ticket (`User.handledTickets`)

#### Indexes

- **`userId`**: Fast lookup of user's tickets
- **`status`**: Fast filtering by status
- **`handledById`**: Fast lookup of tickets by handler

#### Cascade Behavior

- **On User Delete**: User's tickets deleted (`onDelete: Cascade`)
- **On Handler Delete**: `handledById` set to null (`onDelete: SetNull`)

#### Business Logic

**Ticket Lifecycle**:
1. **`sent`**: Initial status when created
2. **`being_processed`**: Assigned to admin/supervisor
3. **`complete`**: Resolved with solution

**Assignment**:
- Only admins/supervisors can assign tickets
- Can assign to themselves or others
- `handledAt` timestamp set on assignment

**Photo Support**:
- Optional screenshot/photo attachment
- Stored as base64 data URL
- Max size: 5MB
- Validated as image format

**Satisfaction Feedback**:
- Only asked when ticket is `complete`
- Only ticket creator can submit
- Used for support quality metrics

**Access Control**:
- Users can only see their own tickets
- Admins/supervisors can see all tickets
- Only admins/supervisors can update status/solution

---

## Relationships Diagram

```
User
├── posts (Note[]) ──────────────┐
├── collaboratedNotes (Note[]) ─┤
├── sentInvites ─────────────────┼──> Note
├── receivedInvites ─────────────┤    ├── author (User)
├── reviews ────────────────────>│    ├── collaborators (User[])
└── supportTickets ──────────────┘    └── invites (CollaborationInvite[])
    │
    └──> Review
         ├── user (User)
         └── replies (ReviewReply[])
              ├── review (Review)
              └── user (User)
    
    └──> SupportTicket
         ├── user (User)
         └── handledBy (User?)
```

---

## Indexes Summary

### Performance Optimizations

**User Model**:
- `role` - Fast role-based queries (admin panel)
- `blocked` - Fast filtering of blocked users

**CollaborationInvite Model**:
- `receiverId` - Fast lookup of user's pending invites
- `inviteToken` - Fast lookup by token (public links)
- `status` - Fast filtering by status

**Review Model**:
- `userId` - Fast lookup of user's review (one per user)
- `createdAt` - Fast sorting by date

**ReviewReply Model**:
- `reviewId` - Fast lookup of all replies for a review
- `userId` - Fast lookup of user's replies

**SupportTicket Model**:
- `userId` - Fast lookup of user's tickets
- `status` - Fast filtering by status
- `handledById` - Fast lookup of tickets by handler

---

## Data Types and Constraints

### UUID Primary Keys
All models use UUID v4 as primary keys:
- **Format**: `123e4567-e89b-12d3-a456-426614174000`
- **Generation**: Automatic via `@default(uuid())`
- **Benefits**: Globally unique, non-sequential (security)

### DateTime Fields
- **`createdAt`**: Set once on creation
- **`updatedAt`**: Auto-updated on any change
- **`expiresAt`**: Manual setting (invites)
- **`lastActiveAt`**: Updated on user actions
- **`handledAt`**: Set on ticket assignment

### Boolean Fields
- **Defaults**: Most default to `false`
- **Nullable**: `satisfied` can be `null` (not asked yet)
- **Usage**: Flags for features (pinned, blocked, collaborative)

### Array Fields
- **`tags`**: String array, stored as PostgreSQL array
- **Benefits**: Native array support, efficient queries
- **Limitations**: Max 20 items, each max 50 chars

### String Constraints
- **Email**: Unique constraint on User.email
- **Invite Token**: Unique constraint on CollaborationInvite.inviteToken
- **Max Lengths**: Enforced in application layer (validation)

---

## Cascade Behaviors

### Cascade Delete (`onDelete: Cascade`)
When parent is deleted, children are automatically deleted:
- **User deleted** → Notes, Reviews, Tickets deleted
- **Note deleted** → Invites deleted
- **Review deleted** → Replies deleted
- **User deleted** → Invites deleted

### Set Null (`onDelete: SetNull`)
When parent is deleted, foreign key set to null:
- **Handler deleted** → `SupportTicket.handledById = null`

**Why SetNull?**
- Tickets should persist even if handler account is deleted
- Historical record maintained
- Can be reassigned later

---

## Business Rules Enforced

### One Review Per User
- Enforced at application level (not database constraint)
- Users can update existing review
- Prevents review spam

### One Note Per Invite
- Each invite is for one specific note
- Invite token is unique globally
- Prevents duplicate invites

### Role Hierarchy
- **user** < **admin** < **supervisor**
- Enforced at application level
- Database stores as string for flexibility

### Collaboration Rules
- Only author can toggle collaboration
- Only author can create invites
- Collaborators cannot delete note
- Collaborators cannot manage collaboration

---

## Migration History

The schema has evolved through multiple migrations:
1. Initial schema (notes, users)
2. Tags added
3. Title added
4. Collaboration features
5. Avatar URL
6. User name
7. User roles and last active
8. Support tickets
9. Reviews and replies

All migrations are in `src/db/migrations/` directory.

---

## Performance Considerations

### Query Optimization
- Indexes on frequently queried fields
- Foreign keys indexed automatically
- Composite indexes where needed

### Data Size Limits
- Note text: 5MB max (application level)
- Photo URL: 5MB max (base64)
- Tags: 20 max per note
- Title: 500 chars max

### Connection Pooling
- Prisma manages connection pool
- Singleton pattern prevents connection leaks
- Efficient for Next.js serverless functions

---

## Security Considerations

### Data Protection
- UUIDs prevent enumeration attacks
- Foreign keys ensure referential integrity
- Cascade deletes prevent orphaned records

### Access Control
- Role-based access at application level
- Database doesn't enforce permissions
- Row-level security via Prisma queries

### Input Validation
- All inputs validated before database
- HTML sanitization for user content
- Size limits prevent DoS attacks

---

## Common Queries

### Get User's Notes
```prisma
prisma.note.findMany({
  where: {
    OR: [
      { authorId: userId },
      { collaborators: { some: { id: userId } } }
    ]
  },
  orderBy: { updatedAt: "desc" }
})
```

### Get Pending Invites
```prisma
prisma.collaborationInvite.findMany({
  where: {
    receiverId: userId,
    status: "pending",
    expiresAt: { gte: new Date() }
  }
})
```

### Get Reviews with Replies
```prisma
prisma.review.findMany({
  include: {
    user: { select: { id: true, name: true, avatarUrl: true } },
    replies: {
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" }
    }
  },
  orderBy: { createdAt: "desc" }
})
```

---

## Future Enhancements

Potential schema additions:
- Note versioning/history
- Note folders/categories
- Note sharing permissions (read-only, etc.)
- File attachments (beyond photos)
- Notification preferences
- User preferences/settings
- Audit logs
- Analytics events

---

**Last Updated**: 2024
**Database**: PostgreSQL
**ORM**: Prisma
**Schema Version**: Current

