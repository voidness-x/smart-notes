# Documentation: src/actions/notes.ts

## Overview
This file contains all server actions related to note management - creation, updates, deletion, and AI-powered question answering. It's the core of the note-taking functionality.

## Purpose in Project
This file manages the entire note lifecycle:
- Creating new notes
- Updating note content, title, and tags
- Deleting notes
- Pinning/unpinning notes
- AI-powered note querying

## Key Functions

### Note CRUD Operations

#### `createNoteAction(noteId: string)`
**Purpose**: Creates a new note in the database.

**Logic Flow**:
1. Requires user authentication via `requireAuth()`
2. Validates noteId as UUID format
3. Creates note with:
   - Provided noteId (generated client-side)
   - Current user as author
   - Empty text content
   - Default title "No title"
4. Returns success/error status

**Why Client-Side ID Generation?**
- Allows optimistic UI updates
- Prevents race conditions
- Enables immediate note creation without waiting for server

**Integration**: Used by `NewNoteButton.tsx` when user clicks "New Note".

**Error Cases**:
- User not authenticated → Error
- Invalid UUID format → Error
- Database constraint violation → Error

---

#### `updateNoteAction(noteId: string, text: string)`
**Purpose**: Updates the text content of a note.

**Logic Flow**:
1. Validates note access (user must be author or collaborator)
2. Validates noteId format
3. Validates text (max 5MB)
4. Updates note text in database
5. Returns success/error status

**Access Control**: Uses `validateNoteAccess()` which checks:
- User is authenticated
- User is either the author OR a collaborator

**Integration**: Called automatically by `NoteTextInput.tsx` on auto-save (debounced).

**Performance**: Called frequently during typing, so debounced on client side.

---

#### `deleteNoteAction(noteId: string)`
**Purpose**: Permanently deletes a note.

**Logic Flow**:
1. Validates note access with `requireAuthor: true`
2. Only author can delete (not collaborators)
3. Deletes note from database
4. Returns success/error status

**Security**: Collaborators cannot delete notes, only authors.

**Integration**: Used by `DeleteNoteButton.tsx` component.

**Cascade Behavior**: Database handles cascade deletion of related records (collaborators, invites, etc.).

---

#### `updateNoteTitleAction(noteId: string, title: string)`
**Purpose**: Updates the title of a note.

**Logic Flow**:
1. Validates note access
2. Validates title (max 500 characters, trimmed)
3. Updates title in database
4. Returns success/error status

**Integration**: Used by `NoteTextInput.tsx` when user edits title.

**Validation**: Title is trimmed and limited to 500 characters.

---

#### `updateNoteTagsAction(noteId: string, tags: string[])`
**Purpose**: Updates the tags associated with a note.

**Logic Flow**:
1. Validates note access
2. Validates tags array:
   - Each tag max 50 characters
   - Max 20 tags per note
   - Tags are trimmed and lowercased
3. Updates tags in database
4. Returns success/error status

**Tag Normalization**: 
- Converted to lowercase
- Trimmed of whitespace
- Limited to 50 characters each

**Integration**: Used by `NoteTextInput.tsx` when user adds/removes tags.

---

#### `togglePinAction(noteId: string)`
**Purpose**: Toggles the pinned status of a note.

**Logic Flow**:
1. Validates note access
2. Fetches current note to get pin status
3. Toggles `pinned` boolean field
4. Returns success status

**UI Impact**: Pinned notes appear at top of sidebar.

**Integration**: Used by `SelectNoteButton.tsx` when user clicks pin icon.

---

### AI Features

#### `askAIAboutNotesAction(newQuestions: string[], responses: string[])`
**Purpose**: Answers questions about user's notes using OpenAI GPT-4o-mini.

**Logic Flow**:
1. Requires authentication
2. Validates question count (max 10)
3. Validates each question (max 1000 chars)
4. Fetches user's notes (last 100, ordered by creation date)
5. Truncates each note to 5000 characters (prevents token overflow)
6. Formats notes for AI context
7. Builds conversation messages:
   - System prompt with note context
   - User questions
   - Previous responses (for conversation continuity)
8. Calls OpenAI API with:
   - Model: gpt-4o-mini
   - Max tokens: 1000
   - Temperature: 0.7
9. Sanitizes AI response HTML
10. Returns sanitized response

**Security Measures**:
- Input validation (question length, count)
- Output sanitization (removes dangerous HTML/scripts)
- Token limits to prevent abuse
- Error handling for API failures

**Error Handling**:
- API key issues → Specific error message
- Rate limits → User-friendly message
- Quota exceeded → Clear message
- Generic errors → Fallback message

**Integration**: Used by `AskAIButton.tsx` component.

**Performance Considerations**:
- Limits to 100 notes to prevent token overflow
- Truncates note text to 5000 chars each
- Limits response to 1000 tokens

**AI Prompt Engineering**:
- System prompt instructs AI to be succinct
- Specifies HTML formatting requirements
- Prohibits dangerous content
- Provides note context

---

## Dependencies

### Internal Dependencies
- `@/db/prisma` - Database client
- `@/lib/utils` - Error handling
- `@/lib/security` - HTML sanitization
- `@/lib/validation` - Input validation schemas
- `@/lib/helpers` - Auth and validation helpers
- `@/openai` - OpenAI API client

### External Dependencies
- `openai/resources/index.mjs` - OpenAI types

## Access Control Pattern

All note operations use `validateNoteAccess()` which:
1. Ensures user is authenticated
2. Validates noteId format
3. Checks if user is author OR collaborator
4. Throws error if access denied

**Exception**: `deleteNoteAction` uses `requireAuthor: true` to ensure only authors can delete.

## Data Flow

### Note Creation Flow
```
User clicks "New Note"
  → NewNoteButton generates UUID
  → createNoteAction called
  → Note created in database
  → User redirected to note
```

### Note Update Flow
```
User types in editor
  → NoteTextInput debounces (500ms)
  → updateNoteAction called
  → Database updated
  → UI shows "saved" status
```

### AI Query Flow
```
User asks question
  → askAIAboutNotesAction called
  → User's notes fetched
  → OpenAI API called
  → Response sanitized
  → Displayed in UI
```

## Validation Rules

### Note Text
- Max length: 5,000,000 characters (~5MB)
- Type: String (HTML content)

### Note Title
- Max length: 500 characters
- Trimmed of whitespace
- Type: String

### Note Tags
- Max tags: 20 per note
- Max tag length: 50 characters
- Normalized: Lowercase, trimmed
- Type: Array of strings

### Note ID
- Format: UUID v4
- Generated: Client-side (UUID library)
- Type: String

## Error Handling

All functions follow this pattern:
```typescript
try {
  // Validation & business logic
  return { errorMessage: null };
} catch (error) {
  return handleError(error);
}
```

**AI Function** has special error handling for:
- API key errors
- Rate limit errors
- Quota errors
- Network errors

## Security Considerations

1. **Access Control**: All operations verify user has permission
2. **Input Validation**: All inputs validated with Zod schemas
3. **HTML Sanitization**: AI responses sanitized before display
4. **Token Limits**: Prevents abuse of AI features
5. **SQL Injection**: Prisma ORM prevents SQL injection

## Database Schema Relations

This file interacts with:
- `Note` model - Main note data
- `User` model - Note authors
- `Collaboration` - Note collaborators (via Prisma relations)

## Performance Optimizations

1. **Debouncing**: Note updates debounced on client (500ms)
2. **Pagination**: AI queries limit to 100 notes
3. **Truncation**: Note text truncated to 5000 chars for AI
4. **Indexing**: Database indexes on authorId, updatedAt for fast queries

## Common Usage Patterns

### Creating a Note
```typescript
const noteId = uuidv4();
const result = await createNoteAction(noteId);
if (!result.errorMessage) {
  router.push(`/notes?noteId=${noteId}`);
}
```

### Updating Note Content
```typescript
const result = await updateNoteAction(noteId, htmlContent);
if (result.errorMessage) {
  toast.error(result.errorMessage);
}
```

### Asking AI
```typescript
const response = await askAIAboutNotesAction(
  ["What are my notes about?"],
  []
);
// Response is already sanitized HTML
```

## Testing Considerations

- Test with valid/invalid note IDs
- Test access control (author vs collaborator)
- Test with very long content
- Test AI with various question types
- Test error scenarios (API failures, network issues)
- Test concurrent edits
- Test with many notes (performance)

## Future Enhancements

Potential improvements:
- Real-time collaboration (WebSockets)
- Note versioning/history
- Export notes (PDF, Markdown)
- Note templates
- Advanced AI features (summarization, categorization)

