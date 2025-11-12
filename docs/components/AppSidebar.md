# Documentation: src/components/ui/AppSidebar.tsx

## Overview
This is a server component that renders the application sidebar. It displays the user's notes list, provides navigation, and includes footer buttons for support and reviews.

## Purpose in Project
This sidebar serves as the primary navigation:
- Lists all user's notes (authored and collaborated)
- Provides note search and filtering
- Shows note metadata (title, tags, dates)
- Quick access to support and reviews

## Component Structure

### Server Component
This is a server component that:
- Fetches data on the server
- Handles authentication
- Queries database for notes
- Passes data to client components

### Props
None - Component is self-contained

## Key Functionality

### Note Fetching

**Logic Flow**:
1. Gets current user via `getUser()`
2. If user is authenticated:
   - Queries database for notes where:
     - User is author OR
     - User is collaborator
   - Orders by `updatedAt` descending (most recent first)
3. If no user:
   - Shows login prompt
   - Empty notes array

**Database Query**:
```typescript
prisma.note.findMany({
  where: {
    OR: [
      { authorId: user.id },
      { collaborators: { some: { id: user.id } } },
    ],
  },
  orderBy: { updatedAt: "desc" },
})
```

**Performance**: Single query with OR condition, efficient with indexes.

---

### Component Rendering

**Structure**:
1. **Sidebar Container**: Main sidebar wrapper
2. **SidebarContent**: Scrollable content area
3. **SidebarGroup**: Note list container
4. **SidebarGroupLabel**: 
   - Shows "Your Notes" if logged in
   - Shows login link if not logged in
5. **SidebarGroupContent**: Client component for note list
6. **SidebarFooter**: 
   - SupportButton
   - ReviewButton

---

## Dependencies

### Internal Dependencies
- `@/auth/server` - `getUser()` for authentication
- `@/db/prisma` - Database client
- `@/components/ui/sidebar` - Sidebar UI components
- `./SidebarGroupContent` - Note list component
- `./ReviewButton` - Review access button
- `./SupportButton` - Support access button

### External Dependencies
- `next/link` - Navigation links
- `@prisma/client` - Type definitions

## Data Flow

### Server-Side Rendering
```
Page request
  → AppSidebar renders on server
  → getUser() checks authentication
  → If authenticated: Query notes from database
  → Pass notes to SidebarGroupContent
  → Render HTML with note data
  → Send to client
```

### Client-Side Interaction
```
User interacts with sidebar
  → SidebarGroupContent handles interactions
  → Updates local state
  → Syncs with editor via NoteProvider
```

## Security Considerations

1. **Authentication**: Only shows notes for authenticated users
2. **Access Control**: Database query ensures user only sees their notes
3. **Privacy**: No note content exposed in sidebar (only metadata)

## Integration Points

### Used In
- `src/app/notes/layout.tsx` - Notes page layout

### Uses
- `SidebarGroupContent` - Note list rendering
- `ReviewButton` - Review access
- `SupportButton` - Support access

## User Experience

### Logged In
- Shows "Your Notes" heading
- Displays note list
- Shows support and review buttons

### Not Logged In
- Shows "Login to see your notes" message
- Login link provided
- Support and review buttons still visible

## Performance Considerations

1. **Server-Side Rendering**: Data fetched on server
2. **Efficient Query**: Single query with OR condition
3. **Indexed Fields**: `authorId` and `updatedAt` indexed
4. **Minimal Data**: Only fetches necessary fields

## Testing Considerations

- Test with authenticated user
- Test with unauthenticated user
- Test with many notes
- Test with no notes
- Test with collaborated notes
- Test note ordering

## Future Enhancements

Potential improvements:
- Note folders/categories
- Note favorites
- Recent notes section
- Note templates
- Bulk operations

