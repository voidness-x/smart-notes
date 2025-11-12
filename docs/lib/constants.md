# Documentation: src/lib/constants.ts

## Overview
This file contains application-wide constants used throughout the codebase. It centralizes configuration values to make them easy to update and maintain.

## Purpose in Project
This file provides:
- Shared configuration values
- Magic number elimination
- Centralized timing constants

## Constants

### `debounceTimeout`
**Type**: `number`
**Value**: `1000` (milliseconds)
**Purpose**: Defines the debounce delay for auto-save operations.

**Usage**: Used in `NoteTextInput.tsx` to debounce note content saves.

**Why 1000ms?**
- Balances responsiveness with server load
- Prevents excessive API calls during typing
- Gives users time to finish typing before saving

**Integration**: 
- Used in `NoteTextInput.tsx` for auto-save
- Controls when `updateNoteAction` is called

**Example**:
```typescript
setTimeout(async () => {
  await updateNoteAction(noteId, html);
}, debounceTimeout); // 1000ms delay
```

---

## Design Principles

### Centralization
All constants in one place:
- Easy to find and update
- Consistent values across app
- Single source of truth

### Naming Convention
- Descriptive names
- Clear purpose
- Type-safe

## Future Constants

Potential additions:
- API timeout values
- Pagination limits
- File size limits
- Rate limiting values
- Feature flags

## Usage Pattern

Import and use directly:
```typescript
import { debounceTimeout } from "@/lib/constants";

setTimeout(() => {
  // Save operation
}, debounceTimeout);
```

## Testing Considerations

- Test debounce timing
- Verify constants are used consistently
- Test with different timeout values

