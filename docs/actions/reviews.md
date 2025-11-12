# Documentation: src/actions/reviews.ts

## Overview
This file contains all server actions related to the review system. It handles creating, updating, retrieving reviews, and managing replies to reviews.

## Purpose in Project
This file manages the user review/rating system that allows:
- Users to leave star ratings and comments
- Viewing all reviews
- Replying to reviews
- Admin/supervisor review moderation

## Key Functions

### Review Management

#### `createReviewAction(rating: number, comment?: string)`
**Purpose**: Creates or updates a user's review.

**Logic Flow**:
1. Requires authentication
2. Validates rating (1-5 integer)
3. Validates and sanitizes comment if provided
4. Checks if user already has a review
5. If review exists:
   - Updates existing review with new rating/comment
6. If no review:
   - Creates new review
7. Includes user details in response
8. Serializes dates for JSON response
9. Returns review object

**Key Features**:
- **One Review Per User**: Users can only have one review (updates if exists)
- **HTML Sanitization**: Comments are sanitized to prevent XSS
- **Date Serialization**: Dates converted to ISO strings for JSON

**Integration**: Used by `ReviewPageClient.tsx` component.

---

#### `getReviewsAction()`
**Purpose**: Retrieves all reviews with replies.

**Logic Flow**:
1. Fetches all reviews from database
2. Orders by creation date (newest first)
3. Includes:
   - User details (id, email, name, avatarUrl)
   - Replies with user details
4. Orders replies by creation date (oldest first)
5. Serializes all dates
6. Returns review list

**Public Access**: No authentication required (public reviews page).

**Integration**: Used by `ReviewPageClient.tsx` to display all reviews.

---

#### `getUserReviewAction()`
**Purpose**: Retrieves the current user's review (if exists).

**Logic Flow**:
1. Gets current user (optional - returns null if not logged in)
2. If user exists, fetches their review
3. Includes user details
4. Serializes dates
5. Returns review or null

**Integration**: Used by `ReviewPageClient.tsx` to show/edit user's own review.

---

#### `replyToReviewAction(reviewId: string, comment: string)`
**Purpose**: Creates a reply to a review.

**Logic Flow**:
1. Requires authentication
2. Validates and sanitizes comment
3. Verifies review exists
4. Creates reply record:
   - Links to review
   - Links to current user
   - Stores sanitized comment
5. Includes user details in response
6. Serializes dates
7. Returns reply object

**Security**: Comments are sanitized to prevent XSS attacks.

**Integration**: Used by `ReviewPageClient.tsx` when user replies to a review.

---

#### `deleteReviewAction(reviewId: string)`
**Purpose**: Deletes a review (admin/supervisor only).

**Logic Flow**:
1. Requires supervisor or admin role
2. Verifies review exists
3. Deletes review (cascade deletes replies)
4. Returns success/error status

**Security**: Only supervisors and admins can delete reviews.

**Integration**: Used by admin panel for review moderation.

---

## Dependencies

### Internal Dependencies
- `@/lib/utils` - Error handling
- `@/db/prisma` - Database client
- `@/lib/validation` - Rating and comment schemas
- `@/lib/security` - HTML sanitization
- `@/lib/helpers` - Auth, role checks, date serialization
- `@/auth/server` - User retrieval

## Data Model

### Review Schema
- `id` - UUID
- `userId` - Foreign key to User
- `rating` - Integer (1-5)
- `comment` - String (optional, max 5000 chars, sanitized)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### ReviewReply Schema
- `id` - UUID
- `reviewId` - Foreign key to Review
- `userId` - Foreign key to User
- `comment` - String (max 5000 chars, sanitized)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## Security Considerations

1. **HTML Sanitization**: All comments sanitized before storage
2. **One Review Per User**: Prevents review spam
3. **Role-Based Deletion**: Only admins/supervisors can delete
4. **Input Validation**: Ratings and comments validated
5. **XSS Prevention**: DOMPurify sanitizes all HTML content

## User Experience Features

### Review Updates
- Users can update their review (change rating/comment)
- Updates replace existing review (not create duplicate)
- Maintains review history (createdAt preserved)

### Reply System
- Multiple users can reply to any review
- Replies ordered chronologically
- Shows reply author information

## Date Serialization

All date fields are serialized to ISO strings:
- Prevents JSON serialization errors
- Ensures consistent date format
- Compatible with client-side date handling

**Helper Functions Used**:
- `serializeDates()` - Single object
- `serializeDatesArray()` - Array of objects

## Common Usage Patterns

### Creating/Updating Review
```typescript
const result = await createReviewAction(5, "Great app!");
if (!result.errorMessage) {
  // Review created/updated
  // result.review contains the review
}
```

### Getting All Reviews
```typescript
const result = await getReviewsAction();
// result.reviews is array of all reviews with replies
```

### Replying to Review
```typescript
const result = await replyToReviewAction(reviewId, "Thanks for the feedback!");
if (!result.errorMessage) {
  // Reply created
}
```

## Error Handling

All functions return consistent error format:
```typescript
{ errorMessage: string | null, review: Review | null }
```

**Error Cases**:
- Invalid rating (not 1-5)
- Comment too long (>5000 chars)
- Review not found (for replies)
- Unauthorized (for deletion)

## Testing Considerations

- Test review creation with valid/invalid ratings
- Test comment validation and sanitization
- Test one-review-per-user constraint
- Test review updates
- Test reply creation
- Test admin deletion
- Test date serialization
- Test with many reviews/replies (performance)

## Future Enhancements

Potential improvements:
- Review helpfulness voting
- Review editing (time-limited)
- Review moderation queue
- Review analytics
- Review search/filtering

