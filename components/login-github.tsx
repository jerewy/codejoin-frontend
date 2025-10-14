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
        return "http://localhost:3000/auth/callback";
      }
    };

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: getRedirectURL(),
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
