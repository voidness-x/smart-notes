# Enable Real-Time Collaboration Guide

## Overview

This guide will help you enable **real-time collaboration** so that when User 1 types, User 2 sees the changes instantly without refreshing, and vice versa.

## Prerequisites

✅ **Code is already implemented** - The real-time collaboration feature has been added to the codebase.

⚠️ **You need to enable Supabase Realtime** - This is the only step required on your end.

## Step 1: Enable Supabase Realtime

### 1.1 Go to Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **smart-notes**

### 1.2 Enable Realtime for Note Table

1. Go to: **Database** → **Replication** (or **Realtime**)
2. Find the **`Note`** table in the list
3. **Toggle ON** the Realtime switch for the `Note` table
4. **Save** the changes

**Alternative Path:**
- Go to: **Database** → **Tables**
- Click on the **`Note`** table
- Look for **"Realtime"** or **"Replication"** settings
- Enable Realtime for this table

### 1.3 Verify Realtime is Enabled

After enabling, you should see:
- ✅ Green indicator or checkmark next to `Note` table
- Status showing "Realtime enabled" or similar

## Step 2: Enable Row Level Security (RLS) for Realtime

**Important:** Realtime requires RLS to be enabled on the `Note` table for security.

### 2.1 Check RLS Status

1. Go to: **Database** → **Tables** → **`Note`**
2. Check if **"Enable Row Level Security"** is ON
3. If it's OFF, enable it

### 2.2 Create RLS Policies (if needed)

If RLS is enabled but you don't have policies, create these:

**Policy 1: Users can read their own notes and collaborative notes**
```sql
CREATE POLICY "Users can read own and collaborative notes"
ON "Note"
FOR SELECT
USING (
  "authorId" = auth.uid() OR
  id IN (
    SELECT "A" FROM "_NoteCollaborators" WHERE "B" = auth.uid()
  )
);
```

**Policy 2: Users can update their own notes and collaborative notes**
```sql
CREATE POLICY "Users can update own and collaborative notes"
ON "Note"
FOR UPDATE
USING (
  "authorId" = auth.uid() OR
  id IN (
    SELECT "A" FROM "_NoteCollaborators" WHERE "B" = auth.uid()
  )
);
```

**Note:** If you already have RLS policies that allow note access, Realtime should work with those.

## Step 3: Test Real-Time Collaboration

### 3.1 Test Setup

1. **User 1**: Open a collaborative note in one browser/device
2. **User 2**: Open the same note in another browser/device (or incognito)
3. Both users should be logged in and have access to the note

### 3.2 Test Real-Time Updates

1. **User 1 types**: Type something in the note
2. **User 2 should see**: Changes appear automatically (within 1-2 seconds)
3. **User 2 types**: Type something in the note
4. **User 1 should see**: Changes appear automatically

### 3.3 Check Browser Console

Open browser console (F12) and look for:
- ✅ `Subscribed to real-time updates for note: [note-id]` - Success message
- ❌ Any error messages about Realtime subscription

## Troubleshooting

### Issue: Changes don't appear in real-time

**Possible Causes:**
1. **Realtime not enabled** - Check Step 1.2
2. **RLS blocking updates** - Check Step 2
3. **Network/WebSocket issues** - Check browser console
4. **Note not collaborative** - Collaboration must be enabled on the note

**Solutions:**
1. Verify Realtime is enabled for `Note` table
2. Check browser console for errors
3. Verify both users have access to the note
4. Ensure note has `isCollaborative = true`

### Issue: "Error subscribing to real-time updates"

**Possible Causes:**
1. Realtime not enabled in Supabase
2. RLS policies blocking access
3. WebSocket connection issues
4. Supabase project configuration

**Solutions:**
1. Double-check Realtime is enabled (Step 1.2)
2. Verify RLS policies allow access
3. Check Supabase project status
4. Try refreshing the page

### Issue: Circular updates (infinite loop)

**This should be handled by the code**, but if you see:
- Editor content constantly changing
- "Saving" status flickering
- Network requests spamming

**Solution:**
- The code includes `markLocalUpdate()` to prevent this
- If it still happens, check browser console for errors
- Report the issue with console logs

### Issue: Only one user sees updates

**Possible Causes:**
1. One user's Realtime subscription failed
2. Network issues on one device
3. Browser blocking WebSocket connections

**Solutions:**
1. Check both browsers' console for errors
2. Verify both users are subscribed (look for success message)
3. Try refreshing the page that's not receiving updates
4. Check network tab for WebSocket connections

## How It Works

1. **When User 1 types:**
   - Changes are debounced (1 second delay)
   - Saved to database via `updateNoteAction`
   - Database triggers Realtime event

2. **Supabase Realtime:**
   - Detects database change
   - Sends WebSocket message to all subscribers

3. **User 2's browser:**
   - Receives WebSocket message
   - `useRealtimeNote` hook triggers callback
   - Editor content updates automatically

4. **Conflict Resolution:**
   - Last write wins (most recent change overwrites)
   - Debouncing prevents too many updates
   - Local update markers prevent circular updates

## Performance Notes

- **Debounce delay**: 1 second (prevents too many database writes)
- **Update frequency**: Changes appear within 1-2 seconds
- **WebSocket connection**: One per collaborative note
- **Bandwidth**: Minimal (only sends when content changes)

## Security

- ✅ **RLS enabled**: Only authorized users can see updates
- ✅ **Access control**: Users can only subscribe to notes they have access to
- ✅ **No data leakage**: Updates only sent to authorized collaborators

## Next Steps

1. ✅ Enable Realtime in Supabase (Step 1)
2. ✅ Verify RLS is configured (Step 2)
3. ✅ Test with two users (Step 3)
4. ✅ Monitor for any issues

## Support

If real-time collaboration still doesn't work after following this guide:

1. **Check browser console** for errors
2. **Check Supabase logs** for Realtime errors
3. **Verify Realtime is enabled** in Supabase dashboard
4. **Test with a simple note** (create new collaborative note)
5. **Check network tab** for WebSocket connections

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

