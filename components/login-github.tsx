"use client";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export const LoginGithub = () => {
  const supabase = getSupabaseClient();
  const handleLogin = async () => {
    if (!supabase) return;

    // Use proper redirect URL logic for both development and production
    const getRedirectURL = () => {
      // Check if we're in the browser
      if (typeof window !== "undefined") {
        // For local development, detect localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return `http://localhost:3003/auth/callback`;
        }
        // For production, use the current origin
        return `${window.location.origin}/auth/callback`;
      }

      // Fallback for server-side
      const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
      const vercelURL = process.env.NEXT_PUBLIC_VERCEL_URL;

      if (siteURL) {
        return `${siteURL}/auth/callback`;
      } else if (vercelURL) {
        return `https://${vercelURL}/auth/callback`;
      } else {
        return "https://codejoin.vercel.app/auth/callback";
      }
    };

    // Ensure URL doesn't have trailing slash to avoid duplication
    const redirectTo = getRedirectURL().replace(/\/$/, '');

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectTo,
        // Use PKCE flow for enhanced security
        flowType: 'pkce',
        // Skip browser redirect to let Supabase handle it properly
        skipBrowserRedirect: false,
      },
    });
  };

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      className="w-full"
      disabled={!supabase}
    >
      <Github className="mr-2 h-4 w-4" />
      GitHub
    </Button>
  );
};
