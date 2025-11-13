# Collaboration Feature Troubleshooting Guide

## Important: Realtime is NOT Required

**Your collaboration feature does NOT use Supabase Realtime.** It uses:
- Prisma with PostgreSQL (direct database access)
- Server actions for invite management
- Debounced updates for note changes
- Standard HTTP requests (no WebSockets)

**Enabling Realtime will NOT fix collaboration issues** because the code doesn't subscribe to Realtime channels.

## Common Collaboration Issues

### 1. Invite Links Not Working

**Symptoms:**
- Invite links don't redirect to notes
- "Invalid or expired invite" errors
- Links show localhost instead of production URL

**Fixes:**
- ✅ **Code Fix Applied**: Invite links now use production URL
- **Check**: Ensure `NEXT_PUBLIC_BASE_URL` is set in Vercel
- **Test**: Create a new invite link and verify it uses production URL

### 2. Invites Not Showing in Inbox

**Symptoms:**
- Pending invites don't appear in Profile → Inbox
- Invites sent but not received

**Possible Causes:**
- **Database Issue**: Check if `CollaborationInvite` records are created
- **User ID Mismatch**: Invite `receiverId` doesn't match logged-in user
- **Expired Invites**: Invites expire after 7 days
- **Status Issue**: Invite status might not be "pending"

**Debugging:**
1. Check Supabase database → `CollaborationInvite` table
2. Verify `receiverId` matches the user's ID
3. Check `status` is "pending"
4. Check `expiresAt` is in the future

### 3. Cannot Accept Invites

**Symptoms:**
- "Invalid or expired invite" error
- Accept button doesn't work
- Invite accepted but note not accessible

**Possible Causes:**
- **Expired Invite**: Invite expired (7 days)
- **Already Accepted**: Invite status is "accepted"
- **Wrong User**: Invite is for a different user
- **Author Inviting Self**: Note author cannot accept their own invite
- **Database Error**: Note update fails

**Debugging:**
1. Check invite `expiresAt` date
2. Check invite `status` (should be "pending")
3. Check invite `receiverId` matches logged-in user
4. Verify note exists and is accessible
5. Check database logs for errors

### 4. Collaborators Cannot See Notes

**Symptoms:**
- Collaborator accepted invite but note doesn't appear in sidebar
- "Note not found" errors
- Cannot access collaborative note

**Possible Causes:**
- **Database Relation Issue**: Collaborator not connected to note
- **Note Not Loaded**: Sidebar query doesn't include collaborators
- **Access Check Failing**: Note access validation fails

**Debugging:**
1. Check `Note` table → `_NoteCollaborators` relation table
2. Verify collaborator ID exists in relation table
3. Check sidebar query includes collaborators:
   ```prisma
   where: {
     OR: [
       { authorId: user.id },
       { collaborators: { some: { id: user.id } } }
     ]
   }
   ```

### 5. Collaboration Toggle Not Working

**Symptoms:**
- "Collab" button doesn't enable/disable collaboration
- Error: "You can only toggle collaboration on your own notes"
- Collaboration enabled but no "Invite" button appears

**Possible Causes:**
- **Not Author**: Only note author can toggle collaboration
- **Database Update Fails**: Note update fails silently
- **State Not Refreshing**: UI doesn't refresh after toggle

**Debugging:**
1. Verify user is the note author (`note.authorId === user.id`)
2. Check database for `isCollaborative` field update
3. Verify `router.refresh()` is called after toggle
4. Check browser console for errors

### 6. Invite Links Use Wrong URL

**Symptoms:**
- Invite links show `localhost:3000` instead of production URL
- Links don't work on mobile

**Fix:**
- ✅ **Code Fix Applied**: `createInviteLinkAction` now uses production URL
- **Verify**: Check Vercel environment variables
- **Test**: Create new invite link after deployment

## Diagnostic Checklist

### Database Checks

1. **Check CollaborationInvite Table:**
   ```sql
   SELECT * FROM "CollaborationInvite" 
   WHERE "status" = 'pending' 
   ORDER BY "createdAt" DESC;
   ```

2. **Check Note Collaborators:**
   ```sql
   SELECT * FROM "_NoteCollaborators";
   ```

3. **Check Note Collaboration Status:**
   ```sql
   SELECT id, "isCollaborative", "authorId" FROM "Note" 
   WHERE "isCollaborative" = true;
   ```

### Code Checks

1. **Verify Invite Link Generation:**
   - Check `createInviteLinkAction` uses correct base URL
   - Verify invite token is generated correctly
   - Check invite is saved to database

2. **Verify Invite Acceptance:**
   - Check `acceptInviteByTokenAction` validates invite
   - Verify collaborator is added to note
   - Check invite status is updated to "accepted"

3. **Verify Note Access:**
   - Check note query includes collaborators
   - Verify access validation allows collaborators
   - Check sidebar loads collaborative notes

### Testing Steps

1. **Test Invite Link Creation:**
   - Enable collaboration on a note
   - Create invite link
   - Verify link uses production URL (not localhost)
   - Copy link and test in incognito/another browser

2. **Test Invite Acceptance:**
   - Open invite link while logged in
   - Verify note appears in sidebar
   - Verify note is accessible
   - Check Profile → Inbox for pending invites

3. **Test Collaboration Toggle:**
   - Create a note
   - Toggle collaboration on
   - Verify "Invite" button appears
   - Toggle collaboration off
   - Verify collaborators are removed

## Common Error Messages

### "Invalid or expired invite"
- **Cause**: Invite expired, already accepted, or invalid token
- **Fix**: Create a new invite link

### "You can only toggle collaboration on your own notes"
- **Cause**: User is not the note author
- **Fix**: Only note author can toggle collaboration

### "User is already a collaborator"
- **Cause**: User is already added as collaborator
- **Fix**: Remove collaborator first, or invite different user

### "An invite has already been sent to this user"
- **Cause**: Pending invite exists for this user
- **Fix**: Wait for user to accept/reject, or cancel existing invite

### "This invite is for a different user"
- **Cause**: Invite `receiverId` doesn't match logged-in user
- **Fix**: User must log in with correct account

## Next Steps

1. **Identify the specific issue:**
   - What exactly isn't working?
   - What error messages do you see?
   - When does it fail?

2. **Check the database:**
   - Verify invites are created
   - Check collaborator relations
   - Verify note collaboration status

3. **Check the logs:**
   - Vercel function logs
   - Browser console errors
   - Database query logs

4. **Test with a new invite:**
   - Create a new note
   - Enable collaboration
   - Create invite link
   - Test accepting the invite

## Do NOT Enable Realtime

**Realtime is NOT needed** for your current collaboration implementation. The feature works through:
- Server actions (HTTP requests)
- Database queries (Prisma)
- Debounced updates (not real-time)

Enabling Realtime would require:
- Rewriting the collaboration feature
- Adding WebSocket subscriptions
- Implementing real-time sync logic
- This is a major refactor, not a quick fix

## If You Want Real-Time Collaboration

If you want real-time collaboration (users see changes instantly), you would need to:
1. Enable Supabase Realtime
2. Add Realtime subscriptions to note changes
3. Implement conflict resolution
4. Handle concurrent edits
5. Update the UI to show live changes

This is a significant feature addition, not a bug fix.

## Quick Fixes

1. **Invite links use localhost:** ✅ Fixed in code
2. **Invites not showing:** Check database and user ID
3. **Cannot accept invites:** Check invite expiration and status
4. **Notes not accessible:** Check collaborator relations
5. **Collaboration toggle fails:** Verify user is note author

## Need More Help?

Provide:
1. **Specific error message**
2. **What you're trying to do** (create invite, accept invite, etc.)
3. **Browser console errors**
4. **Vercel function logs**
5. **Database records** (invites, collaborators)

