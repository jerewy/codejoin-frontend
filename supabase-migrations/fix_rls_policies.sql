-- Fix RLS Policies for CodeJoin Application
-- This file fixes the authentication and database access issues

-- First, let's check if RLS is enabled on the necessary tables
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations for projects they have access to" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;

DROP POLICY IF EXISTS "Users can view collaborators for projects they have access to" ON collaborators;
DROP POLICY IF EXISTS "Users can add collaborators to projects they own" ON collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators from projects they own" ON collaborators;

DROP POLICY IF EXISTS "Users can view project nodes for projects they have access to" ON project_nodes;
DROP POLICY IF EXISTS "Users can create project nodes for projects they have access to" ON project_nodes;
DROP POLICY IF EXISTS "Users can update project nodes for projects they have access to" ON project_nodes;
DROP POLICY IF EXISTS "Users can delete project nodes for projects they have access to" ON project_nodes;

DROP POLICY IF EXISTS "Users can view messages in conversations they have access to" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in conversations they have access to" ON messages;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new, non-conflicting RLS policies

-- Projects table policies
CREATE POLICY "Users can view projects they have access to" ON projects
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = projects.id
        )
    );

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update projects they own" ON projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete projects they own" ON projects
    FOR DELETE USING (auth.uid() = owner_id);

-- Conversations table policies
CREATE POLICY "Users can view conversations for projects they have access to" ON conversations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = conversations.project_id
        ) OR
        auth.uid() = created_by
    );

CREATE POLICY "Users can create conversations for projects they have access to" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = conversations.project_id
        ) OR
        auth.uid() = created_by
    );

CREATE POLICY "Users can update conversations they created" ON conversations
    FOR UPDATE USING (auth.uid() = created_by);

-- Collaborators table policies
CREATE POLICY "Users can view collaborators for projects they have access to" ON collaborators
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = collaborators.project_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM collaborators c2 
            WHERE c2.project_id = collaborators.project_id
        )
    );

CREATE POLICY "Users can add collaborators to projects they own or manage" ON collaborators
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = collaborators.project_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = collaborators.project_id 
            AND role = 'owner'
        )
    );

CREATE POLICY "Users can remove collaborators from projects they own" ON collaborators
    FOR DELETE USING (
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = collaborators.project_id
        )
    );

-- Project nodes table policies
CREATE POLICY "Users can view project nodes for projects they have access to" ON project_nodes
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = project_nodes.project_id
        ) OR
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = project_nodes.project_id
        )
    );

CREATE POLICY "Users can create project nodes for projects they have access to" ON project_nodes
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = project_nodes.project_id
        ) OR
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = project_nodes.project_id
        )
    );

CREATE POLICY "Users can update project nodes for projects they have access to" ON project_nodes
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = project_nodes.project_id
        ) OR
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = project_nodes.project_id
        )
    );

CREATE POLICY "Users can delete project nodes for projects they have access to" ON project_nodes
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = project_nodes.project_id
        ) OR
        auth.uid() IN (
            SELECT owner_id FROM projects 
            WHERE projects.id = project_nodes.project_id
        )
    );

-- Messages table policies
CREATE POLICY "Users can view messages in conversations they have access to" ON messages
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = (
                SELECT project_id FROM conversations 
                WHERE conversations.id = messages.conversation_id
            )
        ) OR
        auth.uid() = user_id
    );

CREATE POLICY "Users can insert messages in conversations they have access to" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM collaborators 
            WHERE collaborators.project_id = (
                SELECT project_id FROM conversations 
                WHERE conversations.id = messages.conversation_id
            )
        ) OR
        auth.uid() = user_id
    );

-- Profiles table policies
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);