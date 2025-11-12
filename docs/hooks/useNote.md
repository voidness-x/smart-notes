# Documentation: src/hooks/useNote.tsx

## Overview
This is a custom React hook that provides access to the global note state managed by `NoteProvider`. It's a convenience wrapper around React Context.

## Purpose in Project
This hook:
- Provides easy access to note state
- Ensures hook is used within provider
- Type-safe state access
- Centralized note state management

## Hook Implementation

### `useNote()`

**Purpose**: Accesses the note context from `NoteProvider`.

**Logic Flow**:
1. Uses `useContext()` to get `NoteProviderContext`
2. Checks if context exists
3. If no context → throws error (prevents misuse)
4. Returns context value

**Return Type**:
```typescript
{
  noteText: string;
  setNoteText: (noteText: string) => void;
  noteTitle: string;
  setNoteTitle: (noteTitle: string) => void;
  noteTags: string[];
  setNoteTags: (tags: string[]) => void;
}
```

**Error Handling**:
- Throws error if used outside `NoteProvider`
- Clear error message guides developers

---

## Dependencies

### Internal Dependencies
- `@/providers/NoteProvider` - Context definition

### External Dependencies
- `react` - `useContext` hook

## Usage Pattern

### In Components
```typescript
import useNote from "@/hooks/useNote";

function MyComponent() {
  const { noteText, setNoteText, noteTitle, setNoteTitle, noteTags, setNoteTags } = useNote();
  
  // Use state
  return <div>{noteTitle}</div>;
}
```

### Provider Requirement
Component must be wrapped in `NoteProvider`:
```typescript
<NoteProvider>
  <MyComponent /> {/* Can use useNote() */}
</NoteProvider>
```

---

## State Management

### Global State
The hook provides access to:
- **noteText**: Current note content (HTML)
- **noteTitle**: Current note title
- **noteTags**: Current note tags array

### State Updates
- All setters are provided
- Updates trigger re-renders
- State persists across component unmounts (within provider)

---

## Integration

### Used By
- `NoteTextInput.tsx` - Main editor component
- `SidebarGroupContent.tsx` - Sidebar note list
- Any component that needs note state

### Requires
- `NoteProvider` wrapping the component tree

## Error Prevention

### Context Check
```typescript
if (!context) {
  throw new Error("useNote must be used within a NoteProvider");
}
```

**Benefits**:
- Catches misuse early
- Clear error message
- Prevents runtime errors

## Testing Considerations

- Test hook within provider
- Test hook outside provider (should throw)
- Test state updates
- Test multiple components using hook

## Design Pattern

This follows the React Context + Custom Hook pattern:
1. Context provides state
2. Hook provides easy access
3. Type-safe API
4. Error handling built-in

## Future Enhancements

Potential additions:
- More note state (metadata, etc.)
- State persistence
- State synchronization
- Optimistic updates

