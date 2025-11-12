# Documentation: src/actions/users.ts

## Overview
This file contains all server actions related to user authentication, profile management, and user administration. It handles the core user lifecycle from sign-up to account management.

## Purpose in Project
This is a critical file that manages:
- User authentication (login, signup, logout)
- Password management (reset, update)
- User profile updates (name, avatar)
- Admin functions (promote, demote, block, unblock users)
- User activity tracking

## Key Functions

### Authentication Functions

#### `loginAction(email: string, password: string)`
**Purpose**: Authenticates a user and creates a session.

**Logic Flow**:
1. Validates email and password using Zod schemas
2. Creates Supabase client for authentication
3. Attempts sign-in with Supabase Auth
4. Handles email confirmation errors specifically
5. Ensures user exists in database (creates if missing - handles race conditions)
6. Returns success/error status

**Error Handling**:
- Invalid credentials → Generic error message (security best practice)
- Unconfirmed email → Specific message prompting email confirmation
- Database errors → Handled gracefully, doesn't block login

**Integration**: Used by `AuthForm.tsx` component on login page.

---

#### `signUpAction(email: string, password: string)`
**Purpose**: Creates a new user account.

**Logic Flow**:
1. Validates email and password
2. Creates Supabase client
3. Signs up user via Supabase Auth
4. Creates corresponding user record in database
5. Handles email confirmation status
6. Returns detailed status including email confirmation info

**Special Features**:
- Handles race conditions (multiple signups simultaneously)
- Verifies user creation in database
- Returns email confirmation status for UI feedback

**Integration**: Used by `AuthForm.tsx` component on sign-up page.

---

#### `logOutAction()`
**Purpose**: Logs out the current user.

**Logic Flow**:
1. Creates Supabase client
2. Calls signOut() to destroy session
3. Returns error if logout fails

**Integration**: Used by `LogOutButton.tsx` component.

---

### Password Management

#### `resetPasswordAction(email: string)`
**Purpose**: Initiates password reset process.

**Logic Flow**:
1. Validates email format
2. Sends password reset email via Supabase
3. Returns generic success message (doesn't reveal if email exists - security)

**Security Note**: Always returns success message even if email doesn't exist to prevent email enumeration attacks.

**Integration**: Used by `ForgotPasswordForm.tsx` component.

---

#### `updatePasswordAction(newPassword: string)`
**Purpose**: Updates user's password after reset.

**Logic Flow**:
1. Requires authentication
2. Validates new password
3. Updates password via Supabase Auth
4. Returns success/error status

**Integration**: Used by `ResetPasswordForm.tsx` component.

---

### Profile Management

#### `updateAvatarAction(avatarUrl: string)`
**Purpose**: Updates user's profile avatar.

**Logic Flow**:
1. Requires authentication
2. Validates avatar URL (max 1MB)
3. Ensures user exists in database
4. Updates avatar URL in database
5. Limits size to prevent storage issues

**Integration**: Used by `ProfileDialog.tsx` component.

---

#### `updateUserNameAction(name: string)`
**Purpose**: Updates user's display name.

**Logic Flow**:
1. Requires authentication
2. Validates name (optional, max 100 chars)
3. Ensures user exists in database
4. Updates name in database (can be null)

**Integration**: Used by `ProfileDialog.tsx` component.

---

### Email Management

#### `resendConfirmationEmailAction(email: string)`
**Purpose**: Resends email confirmation link.

**Logic Flow**:
1. Validates email format
2. Constructs base URL for redirect
3. Resends confirmation email via Supabase
4. Returns success/error status

**Integration**: Used by `AuthForm.tsx` when user needs to confirm email.

---

### Admin Functions

#### `getAllUsersAction()`
**Purpose**: Retrieves all users (admin/supervisor only).

**Logic Flow**:
1. Requires admin or supervisor role
2. Fetches all users from database
3. Includes role, last active, and blocked status
4. Orders by creation date (newest first)
5. Returns serialized user list

**Security**: Only accessible to admins and supervisors.

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

#### `promoteToAdminAction(userId: string)`
**Purpose**: Promotes a user to admin role.

**Logic Flow**:
1. Requires supervisor role
2. Validates userId
3. Verifies target user exists
4. Updates user role to "admin"
5. Returns success/error status

**Security**: Only supervisors can promote users. Cannot promote supervisors.

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

#### `demoteFromAdminAction(userId: string)`
**Purpose**: Removes admin role from a user.

**Logic Flow**:
1. Requires supervisor role
2. Validates userId
3. Verifies user is currently an admin
4. Updates role to "user"
5. Returns success/error status

**Security**: Only supervisors can demote admins. Cannot demote supervisors.

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

#### `blockUserAction(userId: string)`
**Purpose**: Blocks a user from accessing the application.

**Logic Flow**:
1. Requires supervisor role
2. Validates userId
3. Prevents blocking self
4. Prevents blocking supervisors
5. Sets `blocked: true` in database
6. Returns success/error status

**Security**: Blocked users are redirected to `/blocked` page by middleware.

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

#### `unblockUserAction(userId: string)`
**Purpose**: Unblocks a previously blocked user.

**Logic Flow**:
1. Requires supervisor role
2. Validates userId
3. Verifies user is actually blocked
4. Sets `blocked: false` in database
5. Returns success/error status

**Integration**: Used by `ControlPageClient.tsx` in admin panel.

---

### Utility Functions

#### `ensureUserInDatabase(userId: string, email: string)`
**Purpose**: Ensures a user exists in database (helper for other functions).

**Logic Flow**:
1. Validates inputs
2. Checks if user exists
3. Creates user if missing
4. Returns user existence status

**Use Case**: Used internally to maintain database consistency with Supabase Auth.

---

#### `updateUserActivityAction()`
**Purpose**: Updates user's last active timestamp.

**Logic Flow**:
1. Requires authentication
2. Updates `lastActiveAt` field in database
3. Called automatically on user actions

**Integration**: Called by various components to track user activity.

---

## Dependencies

### Internal Dependencies
- `@/auth/server` - Supabase authentication client
- `@/lib/utils` - Error handling utilities
- `@/lib/validation` - Input validation schemas
- `@/lib/helpers` - Authentication helpers
- `@/db/prisma` - Database client

### External Dependencies
- `next/navigation` - Next.js navigation utilities

## Error Handling Pattern

All functions follow a consistent error handling pattern:
```typescript
try {
  // Validation
  // Business logic
  return { errorMessage: null, success: true };
} catch (error) {
  return handleError(error); // Returns { errorMessage: string }
}
```

## Security Considerations

1. **Password Security**: Passwords are never logged or returned. Supabase handles hashing.
2. **Email Enumeration**: Password reset always returns success to prevent email discovery.
3. **Role-Based Access**: Admin functions check user role before execution.
4. **Input Validation**: All inputs validated using Zod schemas.
5. **SQL Injection**: Prisma ORM prevents SQL injection automatically.

## Database Schema Relations

This file interacts with:
- `User` model - Main user data
- Supabase Auth - Authentication provider

## Common Usage Patterns

### Login Flow
```typescript
const result = await loginAction(email, password);
if (result.success) {
  // Redirect to /notes
} else {
  // Show error message
}
```

### Admin Action Pattern
```typescript
const result = await blockUserAction(userId);
if (result.success) {
  // Refresh user list
} else {
  // Show error: result.errorMessage
}
```

## Testing Considerations

- Test with valid/invalid credentials
- Test email confirmation flows
- Test role-based access control
- Test edge cases (race conditions, missing users)
- Test error scenarios (network failures, database errors)

## Future Enhancements

Potential improvements:
- Two-factor authentication
- Password strength requirements
- Account deletion
- Email change functionality
- User preferences/settings

