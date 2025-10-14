"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const processedCodeRef = useRef<string | null>(null);

  // Helper function to get the correct redirect URL
  const getRedirectURL = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/dashboard`;
    }

    const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
    const vercelURL = process.env.NEXT_PUBLIC_VERCEL_URL;

    if (siteURL) {
      return `${siteURL}/dashboard`;
    } else if (vercelURL) {
      return `https://${vercelURL}/dashboard`;
    } else {
      return "http://localhost:3000/dashboard";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      if (!supabase || !isMounted) {
        if (isMounted) router.push("/");
        return;
      }

      // Prevent multiple simultaneous callbacks
      if (isProcessing) {
        console.log("Already processing auth callback, skipping...");
        return;
      }

      // Check if there's a code parameter (OAuth callback)
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle OAuth errors
      if (error) {
        console.error("OAuth error:", error, errorDescription);
        router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        return;
      }

      // Prevent processing the same code multiple times
      if (code && processedCodeRef.current === code) {
        console.log("Code already processed, skipping...");
        return;
      }

      if (code) {
        console.log("Processing OAuth callback with code...");
        processedCodeRef.current = code;
        setIsProcessing(true);

        try {
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (!isMounted) return;

          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError);

            // Handle specific errors
            if (exchangeError.message.includes("rate limit")) {
              router.push("/login?error=Rate limit exceeded. Please try again in a few minutes.");
            } else if (exchangeError.message.includes("code verifier")) {
              router.push("/login?error=Authentication failed. Please try logging in again.");
            } else {
              router.push(`/login?error=${encodeURIComponent(exchangeError.message)}`);
            }
            return;
          }

          if (data.session) {
            console.log("OAuth session established successfully", {
              userId: data.session.user?.id,
              email: data.session.user?.email
            });

            // Store session info for debugging
            console.log("Session user:", data.session.user);
            console.log("Session expires at:", data.session.expires_at);

            // Use Next.js router instead of window.location.href to prevent full page reload
            console.log("Redirecting to dashboard...");
            router.push("/dashboard");
            return;
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Unexpected error in auth callback:", err);
          router.push("/login?error=An unexpected error occurred. Please try again.");
        } finally {
          if (isMounted) {
            setIsProcessing(false);
          }
        }
      } else {
        // No code parameter, just check existing session
        console.log("No OAuth code, checking existing session...");

        try {
          const { data } = await supabase.auth.getSession();

          if (!isMounted) return;

          if (data.session) {
            console.log("Existing session found, redirecting to dashboard", {
              userId: data.session.user?.id,
              email: data.session.user?.email
            });

            // Use Next.js router instead of window.location.href
            console.log("Redirecting to dashboard from existing session...");
            router.push("/dashboard");
            return;
          }
        } catch (err) {
          if (!isMounted) return;
          console.error("Error checking existing session:", err);
        }

        // If we get here, authentication failed
        console.log("Authentication failed - no session found");
        router.push("/login?error=Authentication failed. Please try again.");
      }
    };

    handleAuthCallback();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [router, supabase, searchParams]); // Remove isProcessing from dependencies

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground text-sm">
          {isProcessing ? "Verifying your account..." : "Processing authentication..."}
        </p>
      </div>
    </div>
  );
}
