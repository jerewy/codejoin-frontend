# Fix Authentication and Database Issues Guide

This guide will help you fix the authentication and database issues you're experiencing with your CodeJoin application.

## Issues Fixed

1. **Auth Session Missing Error**: Fixed authentication session not being properly maintained
2. **Missing Database Function**: Created the `ensure_team_chat_conversation` function
3. **RLS Policy Conflicts**: Fixed conflicting Row-Level Security policies that were preventing access
4. **Project Access Issues**: Resolved problems with users not being able to see projects

## Step 1: Run the Database Fix Script

Execute the following command to prepare the SQL scripts:

```bash
npm run fix-auth-issues
```

This will display the SQL scripts you need to run in your Supabase dashboard.

## Step 2: Apply SQL Scripts in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `izngyuhawwlxopcdmfry`
3. Navigate to the **SQL Editor**
4. Run the first SQL script from `supabase-migrations/fix_rls_policies.sql`
5. Run the second SQL script from `supabase-migrations/create_missing_functions.sql`

## Step 3: Verify Your Environment Variables

Make sure your `.env.local` file contains the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://izngyuhawwlxopcdmfry.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Check Supabase Auth Settings

1. In your Supabase Dashboard, go to **Authentication** > **Settings**
2. Ensure **Site URL** is set to: `http://localhost:3000` (for local development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

## Step 5: Restart Your Development Server

```bash
npm run dev
```

## Step 6: Test the Authentication Flow

1. Log out if you're currently logged in
2. Try logging in with Google or GitHub
3. Verify you're redirected to the dashboard after login
4. Navigate to a project and confirm it loads correctly

## Troubleshooting

### If you still see "Auth session missing" error:

1. Clear your browser cookies and local storage
2. Check the browser console for any error messages
3. Verify the middleware is correctly processing OAuth callbacks

### If projects still don't load:

1. Check that the user is added as a collaborator to the project in the `collaborators` table
2. Verify the RLS policies were applied correctly in Supabase
3. Check the browser console for specific error messages

### If the database function error persists:

1. Ensure the `ensure_team_chat_conversation` function was created successfully
2. Check that the function has the correct parameters: `(project_uuid UUID, user_uuid UUID)`
3. Verify the function has execute permissions for authenticated users

## Understanding the Fixes

### RLS Policy Fixes

The new RLS policies ensure that:

- Users can only access projects they own or are collaborators on
- Collaborators can be added by project owners
- Conversations and messages are properly scoped to project members
- Profiles are visible to all authenticated users

### Database Function Fixes

The `ensure_team_chat_conversation` function:

- Checks if a team chat conversation exists for a project
- Creates one if it doesn't exist
- Returns the conversation ID for use in the application

### Middleware Improvements

The middleware now properly:

- Handles OAuth callback processing
- Exchanges authorization codes for sessions
- Maintains authentication state across requests

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware Documentation](https://nextjs.org/docs/advanced-features/middleware)
- [Supabase Auth with Next.js Guide](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

If you continue to experience issues after following these steps, please check the browser console for specific error messages and ensure all SQL scripts were applied successfully in your Supabase dashboard.
