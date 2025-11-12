# Documentation: src/components/ui/SidebarGroupContent.tsx

## Overview
This is a client component that renders and manages the note list in the sidebar. It handles search, filtering, tag selection, and real-time synchronization with the editor.

## Purpose in Project
This component provides:
- Note list display with search
- Tag-based filtering
- Real-time sync with editor
- Note selection and navigation
- Local state management for performance

## Component Structure

### Props
```typescript
type Props = {
  notes: Note[];
}
```
- `notes`: Initial notes array from server

### Client Component
This is a client component that:
- Manages local note state
- Handles user interactions
- Performs client-side search
- Syncs with global note state

## Key Functionality

### Local State Management

**State Variables**:
- `localNotes` - Local copy of notes (updated from props and global state)
- `searchText` - Search input value
- `selectedTag` - Currently selected tag filter

**Why Local State?**
- Enables real-time updates without server round-trips
- Improves performance (no re-fetching)
- Allows optimistic UI updates

---

### Real-Time Synchronization

**Sync Logic**:
1. Receives initial notes from server (via props)
2. Listens to global note state (via `useNote()`)
3. Updates local notes when:
   - Editor content changes
   - Title changes
   - Tags change
4. Detects note switches to prevent stale data

**Update Rules**:
- **Text Updates**: Only if noteText is not empty (prevents clearing on switch)
- **Title Updates**: Only if not switching notes (user is actively editing)
- **Tag Updates**: Only if not switching notes (user is actively editing)

**Note Switch Detection**:
```typescript
const isSwitchingNotes = prevNoteIdRef.current !== "" && 
                         prevNoteIdRef.current !== noteIdParam;
```

---

### Search Functionality

**Implementation**: Uses Fuse.js for fuzzy search

**Search Configuration**:
- Keys: `["text", "tags"]` - Searches in note content and tags
- Threshold: `0.4` - Fuzzy matching sensitivity
- Case-insensitive

**Search Flow**:
1. User types in search box
2. Fuse.js searches through local notes
3. Results filtered in real-time
4. Notes list updates immediately

**Memoization**: Fuse instance memoized to prevent recreation on every render.

---

### Tag Filtering

**Tag Extraction**:
- Collects all unique tags from notes
- Sorted alphabetically
- Displayed as filter buttons

**Filter Logic**:
1. First filters by selected tag
2. Then applies search text filter
3. Results shown in filtered list

**Tag Selection**:
- Click tag to filter
- Click again to clear filter
- Visual indicator for selected tag

---

### Note List Rendering

**Components Used**:
- `SelectNoteButton` - Individual note item
- `DeleteNoteButton` - Delete functionality (for authors)

**Note Display**:
- Shows note title (or "No title")
- Shows tags as badges
- Shows last updated date
- Shows pin indicator
- Highlights active note

---

## Dependencies

### Internal Dependencies
- `@/hooks/useNote` - Global note state
- `@/components/ui/sidebar` - Sidebar UI components
- `./SelectNoteButton` - Note item component
- `./DeleteNoteButton` - Delete button
- UI components (Input, Button)

### External Dependencies
- `fuse.js` - Fuzzy search library
- `lucide-react` - Icons
- `react` - Hooks
- `next/navigation` - Search params

## Complex Logic

### State Update Strategy

**Three Update Sources**:
1. **Props Update**: Server data changes
2. **Global State Update**: Editor changes
3. **Local Updates**: User interactions

**Update Priority**:
- Props → Local state (initial load)
- Global state → Local state (editor sync)
- Local updates → Optimistic UI

---

### Note Switch Handling

**Problem**: When switching notes, need to:
- Update active note in list
- Prevent stale data from old note
- Clear search/filters if needed

**Solution**:
- Tracks previous noteId
- Detects switches
- Updates only active note
- Preserves other notes' state

---

## Performance Optimizations

1. **Memoized Search**: Fuse instance created once
2. **Memoized Filtering**: Filtered notes computed once per change
3. **Local State**: No server round-trips for updates
4. **Selective Updates**: Only updates changed notes

## User Experience Features

### Search
- Real-time search as user types
- Searches both content and tags
- Fuzzy matching for typos
- Clear search button

### Tag Filtering
- Visual tag buttons
- Click to filter
- Shows filtered count
- Clear filter option

### Note Selection
- Click note to open
- Active note highlighted
- Visual feedback
- URL updates

## Integration Points

### Used By
- `AppSidebar.tsx` - Receives notes prop

### Uses
- `SelectNoteButton` - Renders each note
- `DeleteNoteButton` - Delete functionality
- `useNote()` - Syncs with editor

## Testing Considerations

- Test search functionality
- Test tag filtering
- Test note switching
- Test state synchronization
- Test with many notes
- Test with no notes
- Test with no search results

## Future Enhancements

Potential improvements:
- Sort options (date, title, etc.)
- Note grouping
- Drag and drop reordering
- Bulk selection
- Note preview on hover

