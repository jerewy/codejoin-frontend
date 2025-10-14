"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        router.push("/");
        return;
      }

      // Check if there's a code parameter (OAuth callback)
      const code = searchParams.get("code");

      if (code) {
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          code
        );

        if (error) {
          console.error("Error exchanging code for session:", error);
          router.push("/login");
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          return;
        }
      } else {
        // No code parameter, just check existing session
        const { data } = await supabase.auth.getSession();

        if (data.session) {
          router.push("/dashboard");
          return;
        }
      }

      // If we get here, authentication failed
      router.push("/login");
    };

    handleAuthCallback();
  }, [router, supabase, searchParams]);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <p className="text-muted-foreground text-sm">Verifying your account...</p>
    </div>
  );
}
