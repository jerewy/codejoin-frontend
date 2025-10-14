"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { LoginGoogle } from "@/components/login-google";
import { LoginGithub } from "@/components/login-github";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseClient();
  const authUnavailable = !supabase;

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

  // Handle error messages from URL params (e.g., from OAuth callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
      // Clear the error from URL to prevent it from persisting
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    if (!supabase) {
      setError(
        "Authentication is currently unavailable. Please configure Supabase environment variables."
      );
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setError(error.message); // Supabase returns helpful error messages
    } else {
      // Add a small delay to ensure auth state is updated before redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    }

    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Card className="border border-white/10 bg-background/95 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
        <CardDescription>Continue with email or a connected provider.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <LoginGithub />
          <LoginGoogle />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="rounded-full bg-background px-3 py-1 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Show error if any */}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="font-medium text-primary transition hover:text-primary/80"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-md transition hover:from-primary/90 hover:to-primary"
            disabled={isLoading || authUnavailable}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary transition hover:text-primary/80"
          >
            Create one now
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
