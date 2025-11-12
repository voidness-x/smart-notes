# Documentation: src/components/ui/AuthForm.tsx

## Overview
This is a reusable client component that handles both login and sign-up forms. It provides a unified authentication interface with error handling, loading states, and email confirmation resend functionality.

## Purpose in Project
This component serves as the primary authentication UI, used on both `/login` and `/sign-up` pages. It handles:
- User login with email/password
- User registration
- Error handling and user feedback
- Email confirmation resend
- Form validation

## Component Structure

### Props
```typescript
type Props = {
    type: "login" | "signUp";
}
```
- `type`: Determines if component renders login or sign-up form

### State Management
- `isPending`: Loading state during form submission (uses React `useTransition`)
- `lastLoginEmail`: Stores email for resend confirmation feature
- `showResendConfirmation`: Controls visibility of resend confirmation button

## Key Functionality

### Form Submission Handler

#### `handleSubmit(e: React.FormEvent<HTMLFormElement>)`
**Purpose**: Handles form submission for both login and sign-up.

**Logic Flow**:

**For Login**:
1. Prevents default form submission
2. Extracts email and password from form data
3. Stores email for potential resend confirmation
4. Calls `loginAction()` in transition
5. Handles response:
   - **Error**: Shows error toast, checks if email confirmation error
   - **Success**: Shows success toast, redirects to `/notes` using `window.location.href`
6. Uses `window.location.href` instead of router for complete page reload (ensures cookies are set)

**For Sign-Up**:
1. Prevents default form submission
2. Extracts email and password
3. Calls `signUpAction()` in transition
4. Handles response:
   - **Error**: Shows error toast with extended duration
   - **Success**: Shows success toast with email confirmation instructions, redirects to login
5. Provides detailed feedback based on email confirmation status

**Why `window.location.href`?**
- Ensures complete page reload
- Fresh cookies are loaded
- Prevents stale authentication state

---

### Email Confirmation Resend

**Feature**: If login fails due to unconfirmed email, shows "Resend confirmation email" button.

**Logic**:
1. Detects email confirmation errors by checking error message
2. Shows resend button conditionally
3. Calls `resendConfirmationEmailAction()` when clicked
4. Shows success/error toast

**User Experience**: Helps users who forgot to confirm their email.

---

## UI Components

### Form Fields
- **Email Input**: Required, email type, disabled during submission
- **Password Input**: Required, password type, disabled during submission

### Buttons
- **Submit Button**: 
  - Shows spinner when `isPending`
  - Text changes based on form type ("Login" or "Sign Up")
  - Disabled during submission

### Links
- **Forgot Password**: Only shown on login form
- **Resend Confirmation**: Conditionally shown on login form
- **Switch Form**: Link to alternate form (login ↔ sign-up)

---

## Dependencies

### Internal Dependencies
- `@/actions/users` - `loginAction`, `signUpAction`, `resendConfirmationEmailAction`
- `./card` - CardContent, CardFooter
- `./label` - Form labels
- `./input` - Form inputs
- `./button` - Submit button

### External Dependencies
- `next/navigation` - `useRouter` for navigation
- `sonner` - Toast notifications
- `lucide-react` - Loader2 icon
- `react` - `useTransition`, `useState`

## User Experience Features

### Loading States
- Form fields disabled during submission
- Button shows spinner
- Links disabled (pointer-events-none, opacity-50)

### Error Handling
- Clear error messages via toasts
- Extended duration for important messages (8 seconds)
- Specific handling for email confirmation errors

### Success Feedback
- Success toasts with descriptions
- Automatic redirects
- Clear next steps for users

## Integration Points

### Used By
- `src/app/login/page.tsx` - Login page
- `src/app/sign-up/page.tsx` - Sign-up page

### Server Actions Called
- `loginAction()` - Authenticates user
- `signUpAction()` - Creates new account
- `resendConfirmationEmailAction()` - Resends confirmation email

## Error Scenarios Handled

1. **Invalid Credentials**: Shows generic error (security)
2. **Unconfirmed Email**: Shows specific message + resend button
3. **Sign-up Errors**: Shows validation errors
4. **Network Errors**: Shows generic error message
5. **Unexpected Errors**: Catches and displays user-friendly message

## Security Considerations

1. **Generic Error Messages**: Login errors don't reveal if email exists
2. **Password Type**: Password field uses `type="password"`
3. **Form Validation**: HTML5 validation + server-side validation
4. **CSRF Protection**: Next.js handles CSRF for server actions

## State Management Pattern

Uses React `useTransition` for:
- Optimistic UI updates
- Loading state management
- Non-blocking form submission

## Accessibility

- Proper form labels
- Required field indicators
- Disabled states for screen readers
- Keyboard navigation support

## Testing Considerations

- Test login with valid/invalid credentials
- Test sign-up with valid/invalid data
- Test email confirmation flow
- Test resend confirmation button
- Test form validation
- Test loading states
- Test error handling
- Test navigation flows

## Future Enhancements

Potential improvements:
- Remember me checkbox
- Social login (Google, GitHub)
- Two-factor authentication
- Password strength indicator
- CAPTCHA for sign-up
- Terms of service checkbox

