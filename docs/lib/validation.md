# Documentation: src/lib/validation.ts

## Overview
This file defines all Zod validation schemas used throughout the application and provides a validation helper function. It ensures data integrity and security by validating all user inputs before processing.

## Purpose in Project
This file serves as the single source of truth for:
- Input validation rules
- Data type constraints
- Security boundaries (max lengths, formats)
- Consistent validation across the application

## Validation Schemas

### Note-Related Schemas

#### `noteIdSchema`
**Type**: `z.string().uuid()`
**Purpose**: Validates note IDs are valid UUID v4 format
**Usage**: All note operations
**Example**: `"123e4567-e89b-12d3-a456-426614174000"`

---

#### `noteTextSchema`
**Type**: `z.string().max(5000000)`
**Purpose**: Validates note content (HTML text)
**Max Length**: 5,000,000 characters (~5MB)
**Usage**: Note content updates
**Rationale**: Prevents database bloat, allows large notes

---

#### `noteTitleSchema`
**Type**: `z.string().max(500).trim()`
**Purpose**: Validates note titles
**Max Length**: 500 characters
**Transformation**: Trims whitespace
**Usage**: Note title updates
**Rationale**: UI display constraints, prevents abuse

---

#### `noteTagsSchema`
**Type**: `z.array(z.string().max(50).trim().toLowerCase()).max(20)`
**Purpose**: Validates note tags array
**Rules**:
- Max 20 tags per note
- Each tag max 50 characters
- Tags trimmed and lowercased
**Usage**: Note tag updates
**Rationale**: Prevents tag spam, ensures consistency

---

### Authentication Schemas

#### `emailSchema`
**Type**: `z.string().email().max(255)`
**Purpose**: Validates email addresses
**Rules**:
- Must be valid email format
- Max 255 characters (database limit)
**Usage**: Login, signup, password reset
**Example**: `"user@example.com"`

---

#### `passwordSchema`
**Type**: `z.string().min(8).max(128)`
**Purpose**: Validates passwords
**Rules**:
- Minimum 8 characters (security best practice)
- Maximum 128 characters (reasonable limit)
**Usage**: Login, signup, password update
**Rationale**: Balance between security and usability

---

### Review Schemas

#### `ratingSchema`
**Type**: `z.number().int().min(1).max(5)`
**Purpose**: Validates star ratings
**Range**: 1-5 (integer)
**Usage**: Review creation/updates
**Example**: `5` (5 stars)

---

#### `commentSchema`
**Type**: `z.string().max(5000).trim()`
**Purpose**: Validates review comments
**Max Length**: 5000 characters
**Transformation**: Trims whitespace
**Usage**: Review comments and replies
**Rationale**: Allows detailed feedback, prevents abuse

---

### Support Ticket Schemas

#### `supportTitleSchema`
**Type**: `z.string().min(3).max(200).trim()`
**Purpose**: Validates support ticket titles
**Rules**:
- Minimum 3 characters (meaningful title)
- Maximum 200 characters
- Trimmed
**Usage**: Support ticket creation
**Rationale**: Ensures descriptive titles, fits UI

---

#### `supportDescriptionSchema`
**Type**: `z.string().min(10).max(5000).trim()`
**Purpose**: Validates support ticket descriptions
**Rules**:
- Minimum 10 characters (meaningful description)
- Maximum 5000 characters
- Trimmed
**Usage**: Support ticket creation
**Rationale**: Ensures detailed descriptions, prevents spam

---

### AI Schemas

#### `questionSchema`
**Type**: `z.string().min(1).max(1000).trim()`
**Purpose**: Validates AI questions
**Rules**:
- Minimum 1 character (non-empty)
- Maximum 1000 characters
- Trimmed
**Usage**: AI question submission
**Rationale**: Prevents empty questions, limits token usage

---

### User Schemas

#### `userNameSchema`
**Type**: `z.string().max(100).trim()`
**Purpose**: Validates user display names
**Max Length**: 100 characters
**Transformation**: Trims whitespace
**Usage**: User profile updates
**Note**: Optional (can be null/empty)

---

### Collaboration Schemas

#### `inviteTokenSchema`
**Type**: `z.string().length(64)`
**Purpose**: Validates collaboration invite tokens
**Length**: Exactly 64 characters (32 bytes hex)
**Usage**: Invite link validation
**Example**: `"a1b2c3d4e5f6..."` (64 hex chars)

---

## Validation Function

#### `validateInput<T>(schema: z.ZodSchema<T>, input: unknown)`
**Purpose**: Validates input against a Zod schema.

**Return Type**:
```typescript
{ success: true; data: T } | { success: false; error: string }
```

**Logic Flow**:
1. Attempts to parse input with schema
2. If valid: Returns `{ success: true, data: validatedData }`
3. If invalid: Returns `{ success: false, error: errorMessage }`
4. Handles Zod errors specifically
5. Falls back to generic error message

**Usage Pattern**:
```typescript
const result = validateInput(emailSchema, email);
if (result.success) {
  // Use result.data (typed as string)
} else {
  // Show result.error to user
}
```

**Benefits**:
- Type-safe return values
- Non-throwing (suitable for UI error handling)
- Clear error messages
- Handles edge cases gracefully

---

## Dependencies

### External Dependencies
- `zod` - Schema validation library

## Design Principles

### 1. Centralized Validation
All validation rules in one place:
- Easy to update
- Consistent across application
- Single source of truth

### 2. Type Safety
Zod schemas provide:
- Runtime validation
- TypeScript type inference
- Compile-time type checking

### 3. Security First
Validation prevents:
- SQL injection (via type checking)
- XSS (via length limits)
- DoS attacks (via max lengths)
- Data corruption (via format validation)

### 4. User Experience
Validation provides:
- Clear error messages
- Immediate feedback
- Prevents invalid submissions

## Schema Organization

Schemas grouped by feature:
- **Notes**: noteId, noteText, noteTitle, noteTags
- **Auth**: email, password
- **Reviews**: rating, comment
- **Support**: supportTitle, supportDescription
- **AI**: question
- **User**: userName
- **Collaboration**: inviteToken

## Validation Flow

### Typical Validation Flow
```
User Input
  ↓
validateInput(schema, input)
  ↓
Zod Schema Validation
  ↓
Success? → Return typed data
Failure? → Return error message
```

### Integration with Actions
```typescript
export const someAction = async (input: unknown) => {
  const result = validateInput(someSchema, input);
  if (!result.success) {
    return { errorMessage: result.error };
  }
  // Use result.data (validated and typed)
};
```

## Error Messages

Zod provides descriptive error messages:
- Format errors: "Invalid email format"
- Length errors: "String must contain at most 500 character(s)"
- Type errors: "Expected string, received number"

These are user-friendly and actionable.

## Performance Considerations

### Validation Speed
- Zod is fast (milliseconds)
- Validation happens before database operations
- Prevents unnecessary database queries

### Memory Usage
- Schemas are lightweight
- No runtime overhead when not validating
- Efficient string operations

## Common Patterns

### Optional Fields
Some schemas allow optional values:
```typescript
// userName can be null/empty
const name = validateInput(userNameSchema, name || "");
```

### Array Validation
Tags schema validates arrays:
```typescript
const tags = ["tag1", "tag2"];
const result = validateInput(noteTagsSchema, tags);
// Validates each tag + array length
```

### Nested Validation
Complex objects can use nested schemas (future enhancement).

## Testing Considerations

- Test each schema with valid inputs
- Test with invalid inputs (wrong type, too long, etc.)
- Test edge cases (empty strings, null, undefined)
- Test boundary values (min/max lengths)
- Test transformations (trim, toLowerCase)

## Security Implications

### Input Validation
Prevents:
1. **SQL Injection**: Type checking prevents malicious SQL
2. **XSS**: Length limits prevent large payloads
3. **DoS**: Max lengths prevent resource exhaustion
4. **Data Corruption**: Format validation ensures data integrity

### Best Practices
1. **Validate Early**: Validate at API boundary
2. **Validate Everything**: Don't trust client input
3. **Fail Securely**: Reject invalid input
4. **Clear Messages**: Help users fix errors

## Future Enhancements

Potential additions:
- Custom error messages per schema
- Conditional validation (e.g., password strength)
- Async validation (e.g., email uniqueness)
- Validation middleware
- Schema composition utilities

