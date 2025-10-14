"use client";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export const LoginGithub = () => {
  const supabase = getSupabaseClient();
  const handleLogin = async () => {
    if (!supabase) return;

    // Get the current origin for dynamic redirect
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : "http://localhost:3000/auth/callback";

    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
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
