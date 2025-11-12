# Documentation: src/lib/randomName.ts

## Overview
This file provides a utility function to generate random names. It combines adjectives and nouns with numbers to create unique, readable names.

## Purpose in Project
This function generates:
- Random user names (if needed)
- Display names for anonymous users
- Unique identifiers with human-readable format

## Function

### `generateRandomName()`

**Purpose**: Generates a random name string.

**Logic Flow**:
1. Selects random adjective from predefined list
2. Selects random noun from predefined list
3. Generates random number (0-999)
4. Combines: `adjective + noun + number`
5. Returns formatted string

**Format**: `AdjectiveNounNumber`
**Example**: `SwiftTiger42`, `BrightEagle789`

---

## Name Components

### Adjectives (32 options)
Positive, descriptive adjectives like:
- Swift, Bright, Calm, Bold, Clever, Daring, etc.

### Nouns (32 options)
Animal/creature names like:
- Tiger, Eagle, Wolf, Lion, Fox, Bear, etc.

### Number
- Random integer 0-999
- Adds uniqueness
- Prevents collisions

---

## Dependencies

None - Pure function with no dependencies.

## Usage Pattern

```typescript
import { generateRandomName } from "@/lib/randomName";

const name = generateRandomName();
// Result: "SwiftTiger42"
```

## Characteristics

### Uniqueness
- 32 adjectives × 32 nouns × 1000 numbers
- = 1,024,000 possible combinations
- Very low collision probability

### Readability
- Human-readable format
- No special characters
- Easy to remember

### Randomness
- Uses `Math.random()`
- Sufficient for display names
- Not cryptographically secure

## Use Cases

1. **Default User Names**: When user doesn't provide name
2. **Anonymous Users**: Temporary display names
3. **Test Data**: Generating test users
4. **Placeholders**: UI placeholders

## Testing Considerations

- Test name generation
- Test uniqueness (multiple calls)
- Test format consistency
- Test with different random seeds

## Future Enhancements

Potential improvements:
- More name components
- Customizable format
- Name validation
- Collision detection
- Cryptographically secure random

