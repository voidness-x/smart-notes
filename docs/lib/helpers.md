# Documentation: src/lib/helpers.ts

## Overview
This file provides reusable helper functions that simplify common patterns across server actions. It centralizes authentication checks, validation, and data transformation logic to reduce code duplication.

## Purpose in Project
This file serves as a utility library for server-side operations:
- Authentication helpers
- Note access validation
- Input validation wrappers
- Role-based access control
- Date serialization utilities

## Key Functions

### Authentication Helpers

#### `requireAuth()`
**Purpose**: Ensures a user is authenticated, throws error if not.

**Logic Flow**:
1. Calls `getUser()` from auth server
2. If no user, throws error: "You must be logged in"
3. Returns authenticated user object

**Usage Pattern**:
```typescript
const user = await requireAuth();
// User is guaranteed to be authenticated here
```

**Benefits**:
- Reduces repetitive authentication checks
- Consistent error messages
- Type-safe user object

**Integration**: Used by all server actions that require authentication.

---

#### `requireRole(allowedRoles: string[])`
**Purpose**: Ensures user has one of the specified roles.

**Logic Flow**:
1. Calls `requireAuth()` to ensure user is logged in
2. Fetches user's role from database
3. Checks if role is in `allowedRoles` array
4. Throws "Unauthorized" if role doesn't match
5. Returns authenticated user

**Usage Pattern**:
```typescript
// Only admins and supervisors can access
const user = await requireRole(["admin", "supervisor"]);
```

**Security**: Prevents unauthorized access to admin functions.

**Integration**: Used by admin/supervisor-only actions in:
- `users.ts` - User management
- `support.ts` - Ticket management

---

### Note Access Validation

#### `validateNoteAccess(noteId: string, requireAuthor: boolean = false)`
**Purpose**: Validates note ID and checks if user can access the note.

**Logic Flow**:
1. Calls `requireAuth()` to ensure user is logged in
2. Validates noteId format using `noteIdSchema` (UUID)
3. Checks access based on `requireAuthor` flag:
   - If `requireAuthor: true` → Uses `isNoteAuthor()` (only author)
   - If `requireAuthor: false` → Uses `canAccessNote()` (author OR collaborator)
4. Throws error if validation fails or access denied
5. Returns `{ user, noteId: validated.data }`

**Parameters**:
- `noteId`: The note ID to validate and check access for
- `requireAuthor`: If true, only author can access; if false, author or collaborator can access

**Usage Patterns**:
```typescript
// For operations that allow collaborators
const { noteId: validId } = await validateNoteAccess(noteId);

// For operations that require author (like deletion)
const { noteId: validId, user } = await validateNoteAccess(noteId, true);
```

**Benefits**:
- Single function handles validation + access check
- Consistent error messages
- Reduces code duplication across note actions

**Integration**: Used extensively in:
- `notes.ts` - All note operations
- `collaboration.ts` - Collaboration features

---

### Validation Helpers

#### `validate<T>(schema: z.ZodSchema<T>, input: unknown): T`
**Purpose**: Validates input against a Zod schema, throws error if invalid.

**Logic Flow**:
1. Calls `validateInput()` with schema and input
2. If validation fails, throws error with validation message
3. Returns validated and typed data

**Type Safety**: Uses TypeScript generics to ensure return type matches schema.

**Usage Pattern**:
```typescript
// Throws error if invalid, returns typed value if valid
const validEmail = validate(emailSchema, email);
// validEmail is now typed as string and guaranteed valid
```

**Benefits**:
- Throws errors (suitable for try-catch blocks)
- Type-safe return values
- Cleaner code than checking `success` flag

**Integration**: Used throughout server actions for input validation.

**Comparison with `validateInput()`**:
- `validateInput()`: Returns `{ success, data/error }` (non-throwing)
- `validate()`: Throws error on failure (cleaner in try-catch)

---

### Data Serialization

#### `serializeDates<T>(obj: T): T`
**Purpose**: Converts Date objects to ISO strings for JSON serialization.

**Logic Flow**:
1. Creates shallow copy of object
2. Checks if `createdAt` is Date → converts to ISO string
3. Checks if `updatedAt` is Date → converts to ISO string
4. Returns serialized object

**Why Needed**: 
- Next.js server actions serialize data to JSON
- Date objects don't serialize properly
- ISO strings are JSON-safe

**Usage Pattern**:
```typescript
const review = await prisma.review.findFirst(...);
return { review: serializeDates(review) };
```

**Integration**: Used in:
- `reviews.ts` - Review serialization
- Any action returning Prisma models with dates

---

#### `serializeDatesArray<T>(arr: T[]): T[]`
**Purpose**: Serializes dates in an array of objects.

**Logic Flow**:
1. Maps over array
2. Calls `serializeDates()` on each object
3. Returns array with serialized dates

**Usage Pattern**:
```typescript
const reviews = await prisma.review.findMany(...);
return { reviews: serializeDatesArray(reviews) };
```

**Integration**: Used when returning arrays of Prisma models.

---

## Dependencies

### Internal Dependencies
- `@/auth/server` - `getUser()` function
- `@/db/prisma` - Database client for role checks
- `@/lib/security` - `canAccessNote()`, `isNoteAuthor()`
- `@/lib/validation` - `validateInput()`, `noteIdSchema`
- `zod` - Type definitions

## Design Patterns

### Helper Function Pattern
All helpers follow this pattern:
1. **Input validation** - Check prerequisites
2. **Business logic** - Perform operation
3. **Error handling** - Throw descriptive errors
4. **Return typed data** - Type-safe returns

### Error Handling Strategy
- **Throwing errors** - Used in helpers (caught by action's try-catch)
- **Consistent messages** - Standardized error messages
- **Type safety** - Errors are typed and predictable

## Code Reduction Impact

This file significantly reduces code duplication:

**Before (without helpers)**:
```typescript
const user = await getUser();
if (!user) throw new Error("You must be logged in");
const validated = validateInput(noteIdSchema, noteId);
if (!validated.success) throw new Error(validated.error);
const canAccess = await canAccessNote(validated.data, user.id, prisma);
if (!canAccess) throw new Error("You don't have permission");
```

**After (with helpers)**:
```typescript
const { noteId: validId } = await validateNoteAccess(noteId);
```

**Result**: ~70% code reduction in note-related actions.

## Security Considerations

1. **Authentication**: All helpers that need auth call `requireAuth()` first
2. **Authorization**: Role checks prevent unauthorized access
3. **Input Validation**: All inputs validated before use
4. **Type Safety**: TypeScript ensures correct types throughout

## Usage Examples

### Basic Authentication
```typescript
export const someAction = async () => {
  try {
    const user = await requireAuth();
    // User is authenticated
  } catch (error) {
    return handleError(error);
  }
};
```

### Role-Based Access
```typescript
export const adminAction = async () => {
  try {
    const user = await requireRole(["admin", "supervisor"]);
    // User is admin or supervisor
  } catch (error) {
    return handleError(error);
  }
};
```

### Note Access with Validation
```typescript
export const updateNote = async (noteId: string, text: string) => {
  try {
    const { noteId: validId } = await validateNoteAccess(noteId);
    const validText = validate(noteTextSchema, text);
    // Both noteId and text are validated
  } catch (error) {
    return handleError(error);
  }
};
```

### Date Serialization
```typescript
export const getReviews = async () => {
  try {
    const reviews = await prisma.review.findMany(...);
    return { reviews: serializeDatesArray(reviews) };
  } catch (error) {
    return handleError(error);
  }
};
```

## Testing Considerations

- Test `requireAuth()` with authenticated/unauthenticated users
- Test `requireRole()` with different roles
- Test `validateNoteAccess()` with various access scenarios
- Test `validate()` with valid/invalid inputs
- Test date serialization with various date formats

## Future Enhancements

Potential additions:
- `requireEmailVerified()` - Check email confirmation
- `validateFileUpload()` - File validation helper
- `paginate()` - Pagination helper
- `cache()` - Caching helper
- `rateLimit()` - Rate limiting helper

