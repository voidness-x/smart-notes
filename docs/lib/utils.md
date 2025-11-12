# Documentation: src/lib/utils.ts

## Overview
This file contains general utility functions used throughout the application. It provides common helper functions for class name merging and error handling.

## Purpose in Project
This file serves as a utility library providing:
- CSS class name utilities (Tailwind CSS integration)
- Error handling utilities
- Common helper functions

## Key Functions

### CSS Utilities

#### `cn(...inputs: ClassValue[])`
**Purpose**: Merges and deduplicates CSS class names, especially for Tailwind CSS.

**Logic Flow**:
1. Takes variable number of class name inputs
2. Uses `clsx` to conditionally combine classes
3. Uses `twMerge` to merge Tailwind classes and resolve conflicts
4. Returns merged class string

**Why Needed**:
- Tailwind classes can conflict (e.g., `p-4` and `p-2`)
- `twMerge` resolves conflicts intelligently
- `clsx` handles conditional classes

**Usage Pattern**:
```typescript
<div className={cn("base-class", isActive && "active-class", className)}>
```

**Integration**: Used throughout all React components for dynamic styling.

**Example**:
```typescript
cn("p-4", "text-red-500", "p-2") 
// Result: "p-2 text-red-500" (p-2 overrides p-4)
```

---

### Error Handling

#### `handleError(error: unknown)`
**Purpose**: Standardizes error handling across server actions.

**Logic Flow**:
1. Checks if error is `Error` instance → returns error message
2. Checks if error has `message` property → returns stringified message
3. Falls back to generic error message

**Return Type**:
```typescript
{ errorMessage: string }
```

**Why Needed**:
- Consistent error format across all actions
- Handles various error types safely
- Prevents crashes from unexpected error formats

**Usage Pattern**:
```typescript
try {
  // Some operation
} catch (error) {
  return handleError(error);
}
```

**Integration**: Used in all server action files for error handling.

**Error Type Handling**:
- `Error` objects → `error.message`
- Objects with `message` property → `String(error.message)`
- Unknown types → `"An error occurred"`

---

## Dependencies

### External Dependencies
- `clsx` - Conditional class name utility
- `tailwind-merge` - Tailwind CSS class merger

## Design Patterns

### Error Handling Pattern
All server actions use this pattern:
```typescript
try {
  // Business logic
  return { errorMessage: null };
} catch (error) {
  return handleError(error);
}
```

**Benefits**:
- Consistent error format
- Safe error handling
- No crashes from unexpected errors

### Class Name Pattern
All components use `cn()` for dynamic classes:
```typescript
className={cn(
  "base-classes",
  condition && "conditional-class",
  props.className
)}
```

**Benefits**:
- Resolves Tailwind conflicts
- Handles conditional classes
- Merges with prop classes

## Common Usage Examples

### Error Handling
```typescript
export const someAction = async () => {
  try {
    // Operation
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};
```

### Class Names
```typescript
<Button className={cn(
  "px-4 py-2",
  variant === "primary" && "bg-blue-500",
  disabled && "opacity-50"
)}>
```

## Testing Considerations

- Test `cn()` with various class combinations
- Test Tailwind class conflicts
- Test conditional classes
- Test `handleError()` with different error types
- Test error message extraction

## Future Enhancements

Potential additions:
- More error handling utilities
- Logging utilities
- Formatting utilities
- Validation helpers

