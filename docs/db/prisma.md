# Documentation: src/db/prisma.ts

## Overview
This file exports a singleton Prisma client instance. It ensures only one Prisma client exists across the application, which is crucial for Next.js development to prevent multiple database connections.

## Purpose in Project
This file provides:
- Single Prisma client instance
- Development mode connection reuse
- Production-ready database client
- Prevents connection pool exhaustion

## Implementation

### Singleton Pattern

**Logic Flow**:
1. Checks global object for existing Prisma client
2. If exists → Reuses existing client
3. If not exists → Creates new client
4. In development → Stores client in global object
5. In production → Creates new client each time

**Why Singleton?**
- Next.js development mode uses hot module reloading
- Without singleton, each reload creates new Prisma client
- Leads to "too many connections" errors
- Singleton reuses same connection

**Global Object Pattern**:
```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
```

This extends the global object with TypeScript type safety.

---

## Dependencies

### External Dependencies
- `@prisma/client` - Prisma client library

## Usage Pattern

### Import and Use
```typescript
import { prisma } from "@/db/prisma";

// Use in server actions/components
const notes = await prisma.note.findMany();
```

### Used Throughout
- All server actions
- All server components
- API routes
- Any server-side database operations

## Environment Considerations

### Development Mode
- Client stored in global object
- Reused across hot reloads
- Prevents connection leaks

### Production Mode
- New client created (no global storage)
- Each process has its own client
- Proper connection pooling

## Performance

### Connection Pooling
- Prisma manages connection pool automatically
- Singleton ensures pool is shared
- Efficient database connection usage

## Testing Considerations

- Test singleton behavior
- Test connection reuse
- Test in development vs production
- Test with multiple imports

## Future Enhancements

Potential improvements:
- Connection pool configuration
- Query logging
- Performance monitoring
- Connection health checks

