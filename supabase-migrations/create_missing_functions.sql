-- Create missing database functions for CodeJoin application
-- This fixes the "ensure_team_chat_conversation" function error

-- Drop the existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS ensure_team_chat_conversation(project_uuid UUID, user_uuid UUID);

-- Create the ensure_team_chat_conversation function
CREATE OR REPLACE FUNCTION ensure_team_chat_conversation(
    project_uuid UUID,
    user_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id UUID;
BEGIN
    -- Try to find existing team chat conversation
    SELECT id INTO conversation_id
    FROM conversations
    WHERE project_id = project_uuid
    AND type = 'team-chat'
    LIMIT 1;
    
    -- If no conversation exists, create one
    IF conversation_id IS NULL THEN
        INSERT INTO conversations (
            project_id,
            type,
            created_by,
            created_at
        ) VALUES (
            project_uuid,
            'team-chat',
            user_uuid,
            NOW()
        ) RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION ensure_team_chat_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_team_chat_conversation(UUID, UUID) TO service_role;

-- Create a helper function to check if user has access to a project
CREATE OR REPLACE FUNCTION user_has_project_access(
    user_uuid UUID,
    project_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    -- Check if user is the owner
    SELECT EXISTS(
        SELECT 1 FROM projects 
        WHERE id = project_uuid AND owner_id = user_uuid
    ) INTO has_access;
    
    -- If not owner, check if user is a collaborator
    IF NOT has_access THEN
        SELECT EXISTS(
            SELECT 1 FROM collaborators 
            WHERE project_id = project_uuid AND user_id = user_uuid
        ) INTO has_access;
    END IF;
    
    RETURN has_access;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION user_has_project_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_project_access(UUID, UUID) TO service_role;

-- Create a function to get user profile with fallback
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    user_avatar TEXT,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.user_avatar,
        auth.email
    FROM profiles p
    LEFT JOIN auth.users ON auth.users.id = p.id
    WHERE p.id = user_uuid;
    
    -- If no profile found, return basic info from auth.users
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            auth.users.id,
            COALESCE(auth.users.raw_user_meta_data->>'full_name', auth.users.email) as full_name,
            auth.users.raw_user_meta_data->>'avatar_url' as user_avatar,
            auth.users.email
        FROM auth.users
        WHERE auth.users.id = user_uuid;
    END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO service_role;

-- Create a function to initialize user profile if it doesn't exist
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert profile if it doesn't exist
    INSERT INTO profiles (id, full_name, user_avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_profile();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;