# Documentation: src/lib/security.ts

## Overview
This file contains security-related utilities including HTML sanitization, UUID validation, and note access control functions. It's critical for preventing XSS attacks and ensuring proper authorization.

## Purpose in Project
This file provides:
- HTML sanitization (XSS prevention)
- UUID format validation
- Note access control checks
- Security utilities used throughout the application

## Key Functions

### HTML Sanitization

#### `sanitizeHTML(dirty: string): string`
**Purpose**: Sanitizes HTML content to prevent XSS (Cross-Site Scripting) attacks.

**Logic Flow**:
1. Returns empty string if input is empty/null
2. Determines environment (server vs client)
3. Uses DOMPurify to sanitize:
   - **Allowed tags**: p, br, strong, em, u, s, h1-h6, ul, ol, li, a, code, pre
   - **Allowed attributes**: href, title
   - **Forbidden tags**: script, iframe, object, embed, form, input, button
   - **Forbidden attributes**: onerror, onload, onclick, onmouseover, style
4. Falls back to regex stripping if sanitization fails

**Server-Side Implementation**:
- Uses JSDOM to create a DOM environment
- Initializes DOMPurify once (singleton pattern)
- Reuses same instance for performance

**Client-Side Implementation**:
- Uses browser's native DOMPurify
- No JSDOM needed

**Security Features**:
- Removes all script tags
- Removes event handlers (onclick, etc.)
- Removes inline styles
- Only allows safe HTML tags
- Strips data attributes

**Usage**:
```typescript
const userInput = "<script>alert('xss')</script><p>Safe content</p>";
const safe = sanitizeHTML(userInput);
// Result: "<p>Safe content</p>" (script removed)
```

**Integration**: Used in:
- `notes.ts` - AI responses
- `reviews.ts` - Review comments
- Any user-generated HTML content

---

### UUID Validation

#### `isValidUUID(uuid: string): boolean`
**Purpose**: Validates if a string is a valid UUID v4 format.

**Logic Flow**:
1. Tests string against UUID regex pattern
2. Pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
3. Case-insensitive matching
4. Returns true if valid, false otherwise

**Why Important**:
- Prevents SQL injection via invalid IDs
- Ensures database queries use valid UUIDs
- Prevents errors from malformed IDs

**Usage**:
```typescript
if (!isValidUUID(noteId)) {
  return { error: "Invalid note ID" };
}
```

**Integration**: Used in:
- API routes for ID validation
- Action functions before database queries
- Middleware for URL parameter validation

---

### Note Access Control

#### `canAccessNote(noteId: string, userId: string): Promise<boolean>`
**Purpose**: Checks if a user can access a note (author OR collaborator).

**Logic Flow**:
1. Fetches note from database with:
   - `authorId` field
   - `collaborators` relation (just IDs)
2. Checks if user is the author
3. If not author, checks if user is in collaborators list
4. Returns `true` if user has access, `false` otherwise
5. Returns `false` on any error (fail-safe)

**Access Rules**:
- ✅ Author can always access
- ✅ Collaborators can access
- ❌ Other users cannot access

**Performance**: 
- Single database query
- Only fetches necessary fields
- Uses Prisma relations for efficient lookup

**Usage**:
```typescript
const hasAccess = await canAccessNote(noteId, user.id);
if (!hasAccess) {
  throw new Error("Access denied");
}
```

**Integration**: Used by:
- `helpers.ts` - `validateNoteAccess()` function
- Directly in some action functions

---

#### `isNoteAuthor(noteId: string, userId: string): Promise<boolean>`
**Purpose**: Checks if a user is the author of a note.

**Logic Flow**:
1. Fetches note from database (only `authorId` field)
2. Compares `authorId` with provided `userId`
3. Returns `true` if match, `false` otherwise
4. Returns `false` on error (fail-safe)

**Why Separate Function?**
- More efficient than `canAccessNote()` (doesn't fetch collaborators)
- Used for operations that require author-only access (like deletion)

**Usage**:
```typescript
const isAuthor = await isNoteAuthor(noteId, user.id);
if (!isAuthor) {
  throw new Error("Only author can perform this action");
}
```

**Integration**: Used by:
- `helpers.ts` - `validateNoteAccess()` with `requireAuthor: true`
- Actions that require author-only permissions

---

## Dependencies

### Internal Dependencies
- `@/db/prisma` - Database client for access checks

### External Dependencies
- `dompurify` - HTML sanitization library
- `jsdom` - DOM implementation for server-side DOMPurify

## Security Architecture

### Defense in Depth
Multiple layers of security:
1. **Input Validation** - Zod schemas validate format
2. **Access Control** - Functions check permissions
3. **Output Sanitization** - HTML sanitized before display
4. **Database Constraints** - Prisma prevents SQL injection

### XSS Prevention Strategy
1. **Input**: Validate and sanitize on input
2. **Storage**: Store sanitized content
3. **Output**: Sanitize again on display (defense in depth)
4. **AI Responses**: Always sanitize AI-generated HTML

### Access Control Strategy
1. **Authentication**: User must be logged in
2. **Authorization**: Check specific permissions
3. **Fail-Safe**: Deny access on errors
4. **Least Privilege**: Only grant necessary access

## DOMPurify Configuration

### Allowed Tags
Safe HTML tags for rich text:
- Text formatting: `p`, `br`, `strong`, `em`, `u`, `s`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Lists: `ul`, `ol`, `li`
- Links: `a`
- Code: `code`, `pre`

### Forbidden Tags
Dangerous tags that are removed:
- `script` - JavaScript execution
- `iframe` - Embedded content
- `object`, `embed` - Plugins
- `form`, `input`, `button` - Form elements

### Allowed Attributes
- `href` - For links
- `title` - For accessibility

### Forbidden Attributes
- `onerror`, `onload`, `onclick`, `onmouseover` - Event handlers
- `style` - Inline styles (prevents CSS injection)

## Performance Considerations

### DOMPurify Singleton
- Server-side instance created once
- Reused across requests
- Reduces initialization overhead

### Database Queries
- `canAccessNote()`: Fetches author + collaborators (one query)
- `isNoteAuthor()`: Fetches only authorId (minimal data)
- Uses Prisma select to limit fetched fields

## Error Handling

### Fail-Safe Principle
All security functions return `false` on errors:
- Prevents information leakage
- Denies access by default
- Logs errors for debugging (if needed)

### Example
```typescript
try {
  // Access check
} catch {
  return false; // Deny access on error
}
```

## Usage Examples

### Sanitizing User Input
```typescript
const userComment = "<script>alert('xss')</script>Great note!";
const safe = sanitizeHTML(userComment);
// Result: "Great note!" (script removed)
```

### Validating UUID
```typescript
const noteId = "123e4567-e89b-12d3-a456-426614174000";
if (isValidUUID(noteId)) {
  // Proceed with database query
}
```

### Checking Note Access
```typescript
// Check if user can access (author or collaborator)
const canAccess = await canAccessNote(noteId, user.id);
if (canAccess) {
  // Show note
}

// Check if user is author (stricter check)
const isAuthor = await isNoteAuthor(noteId, user.id);
if (isAuthor) {
  // Allow deletion
}
```

## Testing Considerations

- Test HTML sanitization with various XSS payloads
- Test UUID validation with valid/invalid formats
- Test access control with different user roles
- Test error handling (database failures, etc.)
- Test performance with many collaborators

## Security Best Practices

1. **Always sanitize** user-generated HTML
2. **Validate UUIDs** before database queries
3. **Check access** before any note operation
4. **Fail-safe** - deny access on errors
5. **Log security events** for auditing

## Future Enhancements

Potential improvements:
- Content Security Policy (CSP) headers
- Rate limiting for access checks
- Caching for frequently accessed notes
- Audit logging for security events
- Advanced XSS detection patterns

