// ====================================================================
// AUTHENTICATION DIAGNOSTIC SCRIPT
// ====================================================================
// Run this script to check if your authentication setup is working correctly

// You'll need to install the Supabase client if you haven't already:
// npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const SUPABASE_URL = 'https://izngyuhawwlxopcdmfry.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with actual anon key

async function checkAuthSetup() {
    console.log('🔍 Checking Authentication Setup...\n');

    // Check 1: Environment variables
    console.log('1. Checking environment setup...');
    if (!SUPABASE_URL || SUPABASE_URL === 'your-anon-key-here') {
        console.log('❌ Please update SUPABASE_URL and SUPABASE_ANON_KEY in this script');
        return;
    }
    console.log('✅ Supabase URL configured');

    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon-key-here')) {
        console.log('❌ Please update SUPABASE_ANON_KEY with your actual anon key');
        return;
    }
    console.log('✅ Supabase anon key configured\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Check 2: Basic connectivity
        console.log('2. Testing Supabase connection...');
        const { data, error } = await supabase.from('_info').select('version');

        if (error) {
            console.log('❌ Connection failed:', error.message);
            console.log('   Check your Supabase URL and anon key\n');
            return;
        }
        console.log('✅ Connected to Supabase successfully\n');

        // Check 3: Current auth state
        console.log('3. Checking current auth state...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.log('❌ Auth error:', authError.message);
            if (authError.message.includes('AuthSessionMissingError')) {
                console.log('   This is expected when running outside a browser session');
            }
        } else if (user) {
            console.log('✅ Authenticated user found:', user.id);
            console.log('   Email:', user.email || 'No email');
        } else {
            console.log('⚠️  No authenticated user (this may be normal in a script)');
        }

        // Check 4: Test with a mock session
        console.log('\n4. Testing with service role (if available)...');

        // Try using service role key (you'll need to add this)
        const SERVICE_ROLE_KEY = 'your-service-role-key-here'; // Add if available

        if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.includes('your-service-role-key-here')) {
            const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

            const { data: serviceTest, error: serviceError } = await serviceClient
                .rpc('ensure_team_chat_conversation', {
                    project_uuid: '00000000-0000-0000-0000-000000000000',
                    user_uuid: '00000000-0000-0000-0000-000000000000'
                });

            if (serviceError) {
                if (serviceError.message.includes('function') && serviceError.message.includes('does not exist')) {
                    console.log('❌ Function does not exist - run the SQL fix script first');
                } else if (serviceError.message.includes('Project with UUID')) {
                    console.log('✅ Function exists and is callable (expected error for test UUIDs)');
                } else {
                    console.log('❌ Service role test failed:', serviceError.message);
                }
            } else {
                console.log('✅ Service role test successful');
            }
        } else {
            console.log('⚠️  Service role key not provided - skipping service role test');
        }

        // Check 5: Check table access
        console.log('\n5. Testing table access...');
        const { data: tableTest, error: tableError } = await supabase
            .from('profiles')
            .select('count(*)')
            .limit(1);

        if (tableError) {
            console.log('❌ Table access failed:', tableError.message);
            if (tableError.message.includes('permission denied')) {
                console.log('   This suggests RLS policies are blocking access');
                console.log('   Run the urgent-fix.sql script to update RLS policies');
            }
        } else {
            console.log('✅ Table access successful');
        }

        console.log('\n🎯 Authentication Check Complete');
        console.log('\n📋 Recommendations:');
        console.log('1. If auth errors occur, check your frontend authentication flow');
        console.log('2. If table access fails, run the urgent-fix.sql script');
        console.log('3. If function doesn\'t exist, run the SQL fix script first');
        console.log('4. Ensure your frontend properly handles auth state persistence');
        console.log('5. Check browser localStorage/sessionStorage for auth tokens');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the check
checkAuthSetup();