# Documentation: src/components/ui/NoteTextInput.tsx

## Overview
This is the main rich text editor component that provides the core note-taking functionality. It uses Tiptap editor with extensive features including formatting, images, links, and real-time auto-save.

## Purpose in Project
This component is the heart of the note-taking experience:
- Rich text editing with Tiptap
- Real-time auto-save
- Image upload and manipulation
- Tag management
- Title editing
- Word count and statistics
- Sidebar synchronization

## Component Structure

### Props
```typescript
type Props = {
  noteId: string;
  startingNoteText: string;
  startingTags?: string[];
  startingTitle?: string;
}
```

### Client Component
This is a client component ("use client") that:
- Manages complex editor state
- Handles user interactions
- Syncs with global state
- Performs client-side operations

## Key Features

### Tiptap Editor Configuration

**Extensions Used**:
1. **StarterKit**: Core editing features (bold, italic, lists, etc.)
2. **Underline**: Underline text formatting
3. **Link**: Hyperlink support
4. **TextAlign**: Text alignment (left, center, right)
5. **Placeholder**: Placeholder text when empty
6. **Image**: Image insertion with custom attributes

**Editor Configuration**:
- Content: Initialized from `startingNoteText`
- Placeholder: "Type your notes here..."
- Classes: Custom styling for editor
- Base64 images: Allowed for inline images

---

### Auto-Save System

**Dual Debouncing Strategy**:

1. **Global State Update** (100ms debounce):
   - Updates `NoteProvider` state for sidebar sync
   - Fast enough for responsive UI
   - Prevents excessive state updates

2. **Database Save** (1000ms debounce):
   - Calls `updateNoteAction()` to save to database
   - Longer delay to reduce server load
   - Shows "saving" → "saved" status

**Save Status Indicator**:
- "saving" - While debounce timer is active
- "saved" - After successful save
- Auto-clears after 1.5 seconds

---

### State Management

**Local State**:
- `wordCount`, `charCount`, `readingTime` - Statistics
- `saveStatus` - Save indicator
- `tags`, `tagInput` - Tag management
- `title` - Note title
- `showCropModal`, `showResizeModal` - Image modals
- `isCompressingImage` - Image processing state

**Global State** (via `useNote()`):
- `noteText` - Current note content (HTML)
- `noteTitle` - Current note title
- `noteTags` - Current note tags

**State Synchronization**:
- Editor updates → Global state → Sidebar
- Sidebar updates → Global state → Editor
- Prevents circular updates with refs

---

### Note Switching Logic

**Problem**: When switching notes, need to:
- Load new note content
- Clear old note content
- Prevent content mixing

**Solution**:
1. Tracks previous noteId with `prevNoteIdRef`
2. Detects note switches
3. Clears global state on switch
4. Initializes editor with new note content
5. Uses flags to prevent update loops

**Key Refs**:
- `prevNoteIdRef` - Tracks note switches
- `isActiveNoteRef` - Current note active status
- `justInitializedRef` - Prevents sync during init
- `isUpdatingFromStateRef` - Prevents circular updates

---

### Image Handling

**Upload Flow**:
1. User selects image file
2. Validates file type (must be image)
3. Compresses image (max 600KB, 1920px)
4. Shows crop modal
5. User crops image
6. Image inserted into editor
7. User can resize image later

**Image Compression**:
- Target: 600KB (becomes ~800KB base64)
- Max dimensions: 1920x1920
- Quality: 80%
- Uses Web Worker for performance

**Image Modals**:
- `ImageCropModal` - Crop functionality
- `ImageResizeModal` - Resize functionality

---

### Tag Management

**Features**:
- Add tags by typing and pressing Enter
- Remove tags by clicking X
- Tags normalized (lowercase, trimmed)
- Max 20 tags per note
- Max 50 characters per tag
- Real-time sidebar sync

**Tag Functions**:
- `addTag()` - Adds new tag, updates database
- `removeTag()` - Removes tag, updates database
- `handleTagInputKeyDown()` - Enter key handler

---

### Title Management

**Features**:
- Editable title input
- Defaults to "No title" if empty
- Auto-saves with debounce (1000ms)
- Real-time sidebar sync
- Updates global state immediately

**Title Change Handler**:
- Updates local state
- Updates global state (for sidebar)
- Debounced database save

---

### Text Formatting

**Available Formats**:
- Bold, Italic, Underline, Strikethrough
- Headings (H1, H2)
- Lists (Bullet, Numbered)
- Text Alignment (Left, Center, Right)
- Links
- Code blocks

**Formatting Buttons**:
- Toggle buttons for each format
- Active state shows when format is applied
- Keyboard shortcuts supported

---

### Statistics Calculation

**Real-time Statistics**:
- **Word Count**: Counts words (non-empty strings)
- **Character Count**: Counts non-whitespace characters
- **Reading Time**: Words ÷ 200 (words per minute)

**Updates**: Calculated on every editor update

---

## Dependencies

### Internal Dependencies
- `@/hooks/useNote` - Global note state
- `@/actions/notes` - Note update actions
- `@/lib/constants` - Debounce timeout
- `./ImageCropModal` - Image cropping
- `./ImageResizeModal` - Image resizing
- UI components (Button, Input, etc.)

### External Dependencies
- `@tiptap/react` - Rich text editor
- `@tiptap/starter-kit` - Core editor features
- `@tiptap/extension-*` - Editor extensions
- `browser-image-compression` - Image compression
- `lucide-react` - Icons
- `react` - Hooks and state

## Complex Logic Explained

### Circular Update Prevention

**Problem**: Editor updates → Global state → Editor sync → Editor updates (loop)

**Solution**:
```typescript
const isUpdatingFromStateRef = useRef(false);

// When programmatically updating editor
isUpdatingFromStateRef.current = true;
editor.commands.setContent(content);
setTimeout(() => {
  isUpdatingFromStateRef.current = false;
}, 50);

// In onUpdate handler
if (isUpdatingFromStateRef.current) {
  return; // Skip update
}
```

---

### Note Switch Detection

**Logic**:
```typescript
const isSwitchingNotes = prevNoteIdRef.current !== "" && 
                         prevNoteIdRef.current !== noteIdParam;
```

**Purpose**: Distinguishes between:
- Initial load (no previous note)
- Note switch (different note)
- Same note update (same note, content change)

---

### Content Sync Strategy

**Three Sources of Truth**:
1. **Editor Content** - What user sees/types
2. **Global State** - Shared with sidebar
3. **Database** - Persistent storage

**Sync Rules**:
- Editor changes → Global state (100ms debounce)
- Editor changes → Database (1000ms debounce)
- Global state changes → Editor (only if different and not just initialized)

---

## Performance Optimizations

1. **Debouncing**: Reduces save operations
2. **Refs for Flags**: Prevents unnecessary re-renders
3. **Image Compression**: Reduces storage/bandwidth
4. **Selective Updates**: Only updates changed fields
5. **Memoization**: Fuse search index memoized

## Error Handling

### Image Upload Errors
- Invalid file type → Silently ignored
- Compression failure → Falls back to original
- All errors logged to console

### Save Errors
- Handled by server actions
- User sees error via toast (if implemented)
- Editor continues to function

## Integration Points

### Used By
- `src/app/notes/page.tsx` - Main notes page

### Uses
- `NoteProvider` - Global state
- Server actions - Database operations
- Image modals - Image manipulation

## Testing Considerations

- Test editor initialization
- Test note switching
- Test auto-save timing
- Test image upload/compression
- Test tag management
- Test title updates
- Test formatting buttons
- Test circular update prevention
- Test with very long content
- Test with many tags

## Future Enhancements

Potential improvements:
- Real-time collaboration
- Version history
- Export functionality
- Templates
- Advanced formatting
- Math equations
- Tables
- Code syntax highlighting

