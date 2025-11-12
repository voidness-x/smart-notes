# Documentation: src/hooks/use-mobile.ts

## Overview
This is a custom React hook that detects if the current viewport is mobile-sized. It handles server-side rendering correctly to prevent hydration mismatches.

## Purpose in Project
This hook provides:
- Responsive design detection
- Mobile/desktop layout switching
- SSR-safe implementation
- Window resize handling

## Hook Implementation

### `useIsMobile()`

**Purpose**: Returns boolean indicating if viewport is mobile size.

**Logic Flow**:
1. Initializes state with `false` (SSR-safe)
2. Tracks mount status with `hasMounted`
3. On mount:
   - Sets `hasMounted` to `true`
   - Creates media query listener
   - Checks initial window width
   - Sets up resize listener
4. On unmount:
   - Removes event listener
5. Returns `false` during SSR, actual value after mount

**Breakpoint**: 768px (standard tablet/mobile breakpoint)

**SSR Safety**:
- Returns `false` during server-side render
- Prevents hydration mismatches
- Actual value set after client mount

---

## Dependencies

### External Dependencies
- `react` - `useState`, `useEffect`

## Usage Pattern

### In Components
```typescript
import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileLayout />;
  }
  return <DesktopLayout />;
}
```

### Integration
Used by:
- `src/components/ui/sidebar.tsx` - Responsive sidebar behavior

## Performance Considerations

1. **Event Listener**: Only added after mount
2. **Cleanup**: Properly removed on unmount
3. **Media Query**: Efficient browser API
4. **State Updates**: Only on actual resize

## SSR Handling

### Problem
- Server doesn't know window size
- Client might have different size
- Causes hydration mismatch

### Solution
- Always returns `false` during SSR
- Sets actual value after mount
- No mismatch because both start with `false`

## Testing Considerations

- Test on different screen sizes
- Test window resize
- Test SSR behavior
- Test hydration
- Test unmount cleanup

## Future Enhancements

Potential improvements:
- Custom breakpoint parameter
- Multiple breakpoints
- Orientation detection
- Touch device detection

