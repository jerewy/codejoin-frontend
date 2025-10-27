# Urgent Supabase Database Fix Instructions

## Current Issues
1. **Function not found in schema cache**: `ensure_team_chat_conversation`
2. **RLS policy violations**: Blocking inserts on conversations table
3. **AuthSessionMissingError**: Authentication sessions not persisting

## Quick Fix Steps

### Step 1: Apply the Database Fix (CRITICAL)
1. Go to your Supabase Dashboard: https://izngyuhawwlxopcdmfry.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `urgent-fix.sql`
4. **Execute the script**
5. Wait for it to complete (should show "Success" messages)

### Step 2: Verify the Fix
1. In the same SQL Editor, run this test query:
```sql
SELECT public.ensure_team_chat_conversation(
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
);
```

Expected result: Should return an error about "Project with UUID does not exist" (this confirms the function exists)

### Step 3: Test Your Application
1. Restart your Next.js application
2. Try to access the project page that was failing
3. Check the browser console for any remaining errors

### Step 4: If Issues Persist
Run the diagnostic commands in your SQL Editor:
```sql
-- Check function exists
SELECT * FROM pg_proc WHERE proname = 'ensure_team_chat_conversation';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'conversations';

-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('conversations', 'projects', 'profiles');
```

## Files Created for You

### 1. `urgent-fix.sql`
- **CRITICAL**: Run this first in Supabase SQL Editor
- Completely rebuilds the function with proper permissions
- Overhauls all RLS policies with simple, permissive rules
- Forces schema cache refresh multiple times

### 2. `diagnostic_and_fix.sql`
- Comprehensive diagnostic script if you need deeper analysis
- Includes step-by-step verification
- Run only if the urgent fix doesn't work

### 3. `check-auth-setup.js`
- Node.js script to test authentication configuration
- Update with your actual anon key before running
- Use to verify auth is working on the client side

### 4. `test-database-connection.js`
- Simple connection test script
- Tests database access and function calls
- Update with your anon key before running

## Common Issues and Solutions

### Issue: "Function not found in schema cache"
**Solution**: The urgent-fix.sql script forces multiple schema cache refreshes. If it still occurs:
1. Restart your Supabase project from the dashboard
2. Run the schema refresh commands again

### Issue: "new row violates row-level security policy"
**Solution**: The urgent-fix.sql creates very permissive RLS policies. If issues persist:
1. Check if you're properly authenticated
2. Verify the policies were created by running the diagnostic query

### Issue: "AuthSessionMissingError"
**Solution**: This is usually a client-side authentication issue:
1. Check your browser's localStorage for Supabase auth tokens
2. Ensure your auth flow is completing properly
3. Try logging out and logging back in

### Issue: CORS or network errors
**Solution**: Ensure your Supabase URL is correct in your environment variables

## Next Steps After Fix

Once the urgent issues are resolved, consider:
1. **Review RLS policies**: The current policies are very permissive for quick fixes
2. **Add proper constraints**: Implement business logic in RLS policies
3. **Test authentication flow**: Ensure login/logout works properly
4. **Monitor errors**: Set up error tracking for any future issues

## Need Help?

If these fixes don't resolve your issues:
1. Check the Supabase logs in your dashboard
2. Run the diagnostic script and share the output
3. Verify your environment variables are correct
4. Check for any syntax errors in your SQL execution

The urgent-fix.sql script should resolve the majority of the issues you're experiencing by completely rebuilding the function and RLS policies with proper permissions.