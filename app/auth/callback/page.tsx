"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      if (!isMounted) return;

      setIsProcessing(true);
      setMessage("Verifying your account...");

      // Check for OAuth errors in URL
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle OAuth errors
      if (error) {
        console.error("OAuth error:", error, errorDescription);
        setMessage("Authentication failed. Redirecting...");
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorDescription || error)}`);
        }, 2000);
        return;
      }

      try {
        // Give the middleware time to process the OAuth callback and set cookies
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!isMounted) return;

        // Try to get the session using the browser client
        const supabase = getSupabaseClient();
        if (!supabase) {
          setMessage("Authentication client unavailable. Redirecting...");
          setTimeout(() => {
            router.push("/login?error=Authentication client initialization failed");
          }, 2000);
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error("Error getting session after callback:", sessionError);
          setMessage("Session verification failed. Redirecting...");
          setTimeout(() => {
            router.push(`/login?error=${encodeURIComponent(sessionError.message)}`);
          }, 2000);
          return;
        }

        if (data.session) {
          console.log("OAuth session established successfully", {
            userId: data.session.user?.id,
            email: data.session.user?.email
          });

          setMessage("Authentication successful! Redirecting to dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          console.log("No session found after OAuth callback");
          setMessage("Authentication failed. Redirecting to login...");
          setTimeout(() => {
            router.push("/login?error=Authentication failed. Please try again.");
          }, 2000);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected error in auth callback:", err);
        setMessage("An unexpected error occurred. Redirecting...");
        setTimeout(() => {
          router.push("/login?error=An unexpected error occurred. Please try again.");
        }, 2000);
      } finally {
        if (isMounted) {
          setIsProcessing(false);
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Authentication in Progress</h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
