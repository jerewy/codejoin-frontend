const { createClient } = require('@supabase/supabase-js');

// Configuration - replace with your actual values
const SUPABASE_URL = 'https://izngyuhawwlxopcdmfry.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with actual anon key

async function testDatabaseConnection() {
    console.log('🔍 Testing Supabase Database Connection...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Test 1: Check if we can connect to the database
        console.log('1. Testing basic connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('profiles')
            .select('count(*)')
            .limit(1);

        if (connectionError) {
            console.error('❌ Connection failed:', connectionError);
            return;
        }
        console.log('✅ Basic connection successful\n');

        // Test 2: Check if user is authenticated
        console.log('2. Checking authentication state...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('⚠️  No authenticated user found');
            console.log('   This might be normal if running in a script\n');
        } else {
            console.log(`✅ Authenticated user: ${user.id}\n`);
        }

        // Test 3: Check if the function exists
        console.log('3. Testing function existence...');
        const { data: functionTest, error: functionError } = await supabase
            .rpc('ensure_team_chat_conversation', {
                project_uuid: '00000000-0000-0000-0000-000000000000',
                user_uuid: '00000000-0000-0000-0000-000000000000'
            });

        if (functionError) {
            console.log('❌ Function call failed:', functionError.message);

            if (functionError.message.includes('function') && functionError.message.includes('does not exist')) {
                console.log('   📝 The function does not exist - run the diagnostic script first');
            } else if (functionError.message.includes('Project with UUID')) {
                console.log('   ✅ Function exists but failed as expected (invalid test UUIDs)');
            } else {
                console.log('   📝 Other error - check RLS policies and permissions');
            }
        } else {
            console.log('✅ Function exists and is callable');
            console.log('   Result:', functionTest, '\n');
        }

        // Test 4: Check RLS policies by attempting to insert
        console.log('4. Testing RLS policies...');
        const testConversation = {
            id: '00000000-0000-0000-0000-000000000001',
            project_id: '00000000-0000-0000-0000-000000000000',
            created_by: '00000000-0000-0000-0000-000000000000',
            is_team_chat: true
        };

        const { data: insertTest, error: insertError } = await supabase
            .from('conversations')
            .insert(testConversation)
            .select();

        if (insertError) {
            console.log('❌ Insert failed:', insertError.message);

            if (insertError.message.includes('new row violates row-level security policy')) {
                console.log('   📝 RLS policy is blocking inserts - check policies in diagnostic script');
            } else if (insertError.message.includes('null value in column')) {
                console.log('   ✅ RLS is working, but there are missing required columns');
            } else {
                console.log('   📝 Other insert error - check table structure');
            }
        } else {
            console.log('✅ Insert successful - RLS allows authenticated users');
            console.log('   Cleaning up test data...');
            await supabase
                .from('conversations')
                .delete()
                .eq('id', testConversation.id);
        }

        console.log('\n🎯 Database Connection Test Complete');
        console.log('\n📋 Next Steps:');
        console.log('1. If function does not exist: Run diagnostic_and_fix.sql in Supabase SQL editor');
        console.log('2. If RLS blocks access: Check policies in diagnostic script');
        console.log('3. If no authenticated user: Ensure your app properly handles authentication');
        console.log('4. If schema cache issues: Run NOTIFY pgrst commands from the script');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the test
testDatabaseConnection();