# Documentation: src/providers/NoteProvider.tsx

## Overview
This is a React Context Provider that manages global note state (text, title, tags) across the application. It enables components to share note data without prop drilling.

## Purpose in Project
This provider:
- Manages global note state
- Provides state to all child components
- Enables sidebar-editor synchronization
- Centralizes note state management

## Component Structure

### Context Definition
```typescript
type NoteProviderContextType = {
  noteText: string;
  setNoteText: (noteText: string) => void;
  noteTitle: string;
  setNoteTitle: (noteTitle: string) => void;
  noteTags: string[];
  setNoteTags: (tags: string[]) => void;
};
```

### Default Context Value
Provides default empty values (used if context accessed incorrectly).

---

## Provider Component

### `NoteProvider({ children })`

**Purpose**: Wraps application and provides note context.

**State Management**:
- `noteText`: Current note content (HTML string)
- `noteTitle`: Current note title
- `noteTags`: Current note tags array

**Logic Flow**:
1. Initializes state with empty values
2. Creates context provider with state and setters
3. Wraps children with provider
4. All children can access state via `useNote()` hook

---

## Dependencies

### External Dependencies
- `react` - `useState`, `createContext`, `Context.Provider`

## Usage Pattern

### Wrapping Application
```typescript
// In layout.tsx
<NoteProvider>
  <App />
</NoteProvider>
```

### Accessing State
```typescript
// In any component
const { noteText, setNoteText } = useNote();
```

---

## State Synchronization

### How It Works
1. **Editor Updates**: `NoteTextInput` updates global state
2. **Sidebar Sync**: `SidebarGroupContent` reads global state
3. **Real-time Updates**: Changes reflect immediately

### Update Flow
```
User types in editor
  → NoteTextInput calls setNoteText()
  → Global state updates
  → SidebarGroupContent re-renders
  → Sidebar shows updated content
```

---

## Integration

### Used In
- `src/app/notes/layout.tsx` - Wraps notes page

### Used By
- `NoteTextInput.tsx` - Updates state
- `SidebarGroupContent.tsx` - Reads state
- Any component using `useNote()` hook

## State Lifecycle

### Initialization
- State starts empty
- Populated when note is selected
- Cleared when switching notes

### Updates
- State updates trigger re-renders
- All consumers update simultaneously
- No prop drilling needed

## Benefits

1. **No Prop Drilling**: State accessible anywhere
2. **Centralized State**: Single source of truth
3. **Real-time Sync**: Immediate updates
4. **Type Safety**: TypeScript ensures correct usage

## Limitations

1. **Global State**: All notes share same state
2. **No Persistence**: State lost on page refresh
3. **Single Note**: Only one note's state at a time

## Testing Considerations

- Test provider wrapping
- Test state updates
- Test multiple consumers
- Test state clearing
- Test with useNote hook

## Future Enhancements

Potential improvements:
- State persistence (localStorage)
- Multiple note states
- State history/undo
- Optimistic updates
- State validation

