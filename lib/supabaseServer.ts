// lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Create a service role client for server-side operations
export function createServiceRoleSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Simple service role database helper for all server-side operations
export function getSupabaseServer() {
  return createServiceRoleSupabase()
}

// Helper function to create conversation with fallback auth
export async function createTeamChatConversationWithFallback(
  projectId: string,
  userId?: string
): Promise<{ conversationId: string | null; error: any }> {
  // Use service role client directly for reliability
  try {
    const serviceSupabase = getSupabaseServer()
    const { data, error } = await serviceSupabase.rpc("ensure_team_chat_conversation", {
      project_uuid: projectId,
      user_uuid: userId || '085b30cd-c982-4242-bc6f-4a8c78130d43' // fallback user ID
    })

    if (!error && data) {
      return { conversationId: data, error: null }
    } else {
      return { conversationId: null, error }
    }
  } catch (error) {
    console.error("Service role creation failed:", error)
    return { conversationId: null, error }
  }
}
