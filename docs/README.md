# Smart Notes - Complete Code Documentation

## Overview
This directory contains comprehensive documentation for every code file in the Smart Notes project. Each documentation file explains the code's purpose, logic, dependencies, and role within the overall application architecture.

## Documentation Structure

### Actions (`docs/actions/`)
Server actions that handle business logic:
- **[users.md](actions/users.md)** - Authentication, user management, admin functions
- **[notes.md](actions/notes.md)** - Note CRUD operations, AI features
- **[collaboration.md](actions/collaboration.md)** - Collaboration invites and management
- **[reviews.md](actions/reviews.md)** - Review system and replies
- **[support.md](actions/support.md)** - Support ticket system

### Library Files (`docs/lib/`)
Core utilities and helpers:
- **[helpers.md](lib/helpers.md)** - Reusable helper functions (auth, validation, serialization)
- **[security.md](lib/security.md)** - Security utilities (sanitization, access control)
- **[validation.md](lib/validation.md)** - Input validation schemas
- **[utils.md](lib/utils.md)** - General utilities (class names, error handling)
- **[constants.md](lib/constants.md)** - Application constants
- **[randomName.md](lib/randomName.md)** - Random name generation

### Components (`docs/components/`)
UI components documentation:
- **[AuthForm.md](components/AuthForm.md)** - Login/sign-up form component
- **[NoteTextInput.md](components/NoteTextInput.md)** - Rich text editor component
- **[AppSidebar.md](components/AppSidebar.md)** - Sidebar navigation component
- **[SidebarGroupContent.md](components/SidebarGroupContent.md)** - Note list with search

### App Routes (`docs/app/`)
Page components and API routes:
- **[notes-page.md](app/notes-page.md)** - Main notes page
- **[api/create-new-note.md](app/api/create-new-note.md)** - Note creation API
- **[api/fetch-newest-note.md](app/api/fetch-newest-note.md)** - Note fetching API

### Core Files
- **[middleware.md](middleware.md)** - Next.js middleware (session, redirects)
- **[auth/server.md](auth/server.md)** - Server-side authentication
- **[auth/client.md](auth/client.md)** - Client-side authentication
- **[hooks/useNote.md](hooks/useNote.md)** - Note state hook
- **[hooks/use-mobile.md](hooks/use-mobile.md)** - Mobile detection hook
- **[providers/NoteProvider.md](providers/NoteProvider.md)** - Global note state provider
- **[db/prisma.md](db/prisma.md)** - Database client singleton
- **[db/schema.md](db/schema.md)** - Complete database schema documentation ⭐
- **[openai/index.md](openai/index.md)** - OpenAI client configuration

## Documentation Format

Each documentation file follows this structure:

1. **Overview** - High-level description
2. **Purpose in Project** - Role and importance
3. **Key Functions/Components** - Detailed explanations
4. **Dependencies** - Internal and external dependencies
5. **Logic Flow** - Step-by-step explanations
6. **Integration Points** - How it connects to other parts
7. **Security Considerations** - Security features
8. **Performance** - Optimization strategies
9. **Testing Considerations** - What to test
10. **Future Enhancements** - Potential improvements

## How to Use This Documentation

### For Developers
- Understand code structure and logic
- Learn how components interact
- Find integration points
- Understand security measures
- Plan future enhancements

### For Onboarding
- Start with core files (auth, middleware)
- Read action files to understand features
- Review components for UI understanding
- Check integration points for data flow

### For Maintenance
- Reference when making changes
- Understand dependencies before modifying
- Check security considerations
- Review testing considerations

## Code Architecture Overview

### Data Flow
```
User Action
  → Client Component
  → Server Action
  → Database (Prisma)
  → Response
  → UI Update
```

### Authentication Flow
```
Request
  → Middleware (session check)
  → Server Component/Action
  → getUser() / requireAuth()
  → Supabase Auth
  → Database
```

### State Management
```
Server Data
  → Props to Components
  → Local State
  → Global State (NoteProvider)
  → Component Sync
```

## Key Concepts

### Server Actions
All business logic in `src/actions/`:
- Authentication required
- Input validation
- Database operations
- Error handling

### Security Layers
1. **Input Validation** - Zod schemas
2. **Access Control** - Role/permission checks
3. **Output Sanitization** - HTML sanitization
4. **Database Security** - Prisma ORM protection

### State Management
- **Server State**: Database (source of truth)
- **Global State**: NoteProvider (client-side sync)
- **Local State**: Component state (UI interactions)

## File Organization

### Actions (`src/actions/`)
Business logic separated by feature:
- `users.ts` - User management
- `notes.ts` - Note operations
- `collaboration.ts` - Collaboration
- `reviews.ts` - Reviews
- `support.ts` - Support tickets

### Components (`src/components/`)
UI organized by type:
- `ui/` - Reusable UI components
- Root level - Page-specific components

### Library (`src/lib/`)
Utilities organized by purpose:
- `helpers.ts` - Reusable helpers
- `security.ts` - Security utilities
- `validation.ts` - Validation schemas
- `utils.ts` - General utilities

## Best Practices Documented

1. **Error Handling**: Consistent patterns across actions
2. **Validation**: All inputs validated with Zod
3. **Security**: Multiple layers of protection
4. **Performance**: Optimizations documented
5. **Type Safety**: TypeScript usage explained

## Missing Documentation

If a file is not documented yet, check:
1. Is it a generated file? (e.g., `next-env.d.ts`)
2. Is it a configuration file? (e.g., `next.config.ts`)
3. Is it a simple utility? (may be documented in related files)

## Contributing

When adding new files:
1. Create corresponding documentation
2. Follow existing documentation format
3. Include all sections
4. Update this README

## Quick Reference

### Most Important Files
1. **Actions**: Core business logic
2. **Middleware**: Request handling
3. **Auth**: Authentication foundation
4. **Components**: UI implementation
5. **Helpers**: Reusable utilities
6. **Database Schema**: Data structure and relationships ⭐

### Security-Critical Files
1. `lib/security.ts` - Security utilities
2. `lib/validation.ts` - Input validation
3. `auth/server.ts` - Authentication
4. `middleware.ts` - Request security

### Performance-Critical Files
1. `db/prisma.ts` - Database client
2. `middleware.ts` - Request handling
3. `components/NoteTextInput.tsx` - Editor performance

### Database Documentation
1. **[db/schema.md](db/schema.md)** - Complete schema with all models, relationships, and business rules
2. **[db/prisma.md](db/prisma.md)** - Database client configuration

---

**Last Updated**: 2024
**Documentation Version**: 1.0

