"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminCount = async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if (!error && data !== null) {
          setAdminCount(data.length || 0);
        }
      } catch (err) {
        console.error("Error checking admin count:", err);
      } finally {
        setIsCheckingAdmins(false);
      }
    };

    checkAdminCount();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        throw new Error("An account with this email already exists. Please login instead.");
      }

      if (role === 'admin') {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if (count && count >= 2) {
          throw new Error("Maximum admin accounts (2) already exist. Please sign up as a citizen.");
        }
      }

      const redirectUrl = role === 'admin' 
        ? `${window.location.origin}/admin`
        : `${window.location.origin}/citizen`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            role: role // Use selected role
          }
        },
      });
      
      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          throw new Error("An account with this email already exists. Please login instead.");
        }
        throw error;
      }
      
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
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
              Join your community in making a difference
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label>Account Type</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => setRole(value as 'citizen' | 'admin')}
                      disabled={isCheckingAdmins}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="citizen" id="citizen" />
                        <Label htmlFor="citizen" className="font-normal cursor-pointer">
                          Citizen Account
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="admin" 
                          id="admin" 
                          disabled={adminCount >= 2}
                        />
                        <Label 
                          htmlFor="admin" 
                          className={`font-normal ${adminCount >= 2 ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          Admin Account {adminCount >= 2 && "(Limit reached)"}
                        </Label>
                      </div>
                    </RadioGroup>
                    {adminCount >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        Maximum 2 admin accounts allowed. {adminCount} admin(s) already exist.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
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
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Repeat Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="text-sm text-destructive">
                      {error}
                      {error.includes("already exists") && (
                        <div className="mt-2">
                          <Link href="/auth/login" className="underline underline-offset-4 font-medium">
                            Login to your account
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading || isCheckingAdmins}>
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  Municipal officers must be created by an administrator
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
