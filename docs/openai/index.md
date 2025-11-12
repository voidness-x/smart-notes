# Documentation: src/openai/index.ts

## Overview
This file exports a configured OpenAI client instance. It initializes the OpenAI SDK with the API key from environment variables.

## Purpose in Project
This file provides:
- OpenAI API client configuration
- Centralized API key management
- Reusable client instance
- Type-safe OpenAI integration

## Implementation

### Client Initialization

**Logic Flow**:
1. Creates new OpenAI client
2. Sets API key from environment variable
3. Exports client as default export

**Configuration**:
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Environment Variable**: `OPENAI_API_KEY`

---

## Dependencies

### External Dependencies
- `openai` - OpenAI Node.js SDK

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API key

## Usage Pattern

### Import and Use
```typescript
import openai from "@/openai";

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [...],
});
```

### Used In
- `src/actions/notes.ts` - `askAIAboutNotesAction()`

## API Integration

### Models Used
- `gpt-4o-mini` - Cost-effective model for note queries

### Features Used
- Chat completions
- System prompts
- Message history
- Token limits

## Security Considerations

1. **API Key**: Stored in environment variables
2. **Server-Only**: Client only used in server actions
3. **No Exposure**: API key never sent to client

## Error Handling

Errors handled in action functions:
- API key errors
- Rate limit errors
- Quota errors
- Network errors

## Testing Considerations

- Test with valid API key
- Test with invalid API key
- Test rate limiting
- Test quota exhaustion
- Test network errors

## Future Enhancements

Potential improvements:
- Multiple model support
- Streaming responses
- Caching
- Retry logic
- Cost tracking

