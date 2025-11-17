"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        // Check if it's an invalid credentials error
        if (authError.message.includes("Invalid login credentials") || authError.message.includes("Email not confirmed")) {
          // Verify if the email exists in the system
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const userExists = existingUsers?.users?.some(u => u.email === email);
          
          if (!userExists) {
            throw new Error("No account found with this email. Please sign up first.");
          }
        }
        throw authError;
      }

      console.log("[v0] User logged in:", authData.user.id);

      let profile = null;
      let retries = 3;
      
      while (retries > 0 && !profile) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();
        
        if (profileData) {
          profile = profileData;
          console.log("[v0] Profile found:", profile);
          break;
        }
        
        console.log("[v0] Profile not found, retrying... Retries left:", retries - 1);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      }

      if (!profile) {
        console.log("[v0] Creating profile manually");
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || 'User',
            role: 'citizen'
          });
        
        if (insertError) {
          console.error("[v0] Error creating profile:", insertError);
          throw new Error("Failed to create user profile");
        }
        
        profile = { role: 'citizen' };
      }

      console.log("[v0] Redirecting based on role:", profile.role);
      
      if (profile.role === 'admin') {
        router.push("/admin");
      } else if (profile.role === 'l2_officer') {
        router.push("/l2-dashboard");
      } else if (profile.role === 'l1_officer') {
        router.push("/l1-dashboard");
      } else {
        router.push("/citizen");
      }
      
      router.refresh();
    } catch (error: unknown) {
      console.error("[v0] Login error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-balance">CivicResponse</h1>
            <p className="text-muted-foreground text-balance">
              Report and track civic issues in your community
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-destructive">
                      {error}
                      {error.includes("No account found") && (
                        <div className="mt-2">
                          <Link href="/auth/sign-up" className="underline underline-offset-4 font-medium">
                            Create a new account
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
