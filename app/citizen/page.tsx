'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueCard } from "@/components/issue-card";
import { Plus, AlertCircle } from 'lucide-react';
import Link from "next/link";
import { Issue, Profile } from "@/lib/types";

export default function CitizenDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log("[v0] No session found, redirecting to login");
          router.push('/auth/login');
          return;
        }

        console.log("[v0] Session found for user:", session.user.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!profileData || profileData.role !== 'citizen') {
          console.log("[v0] Profile not found or wrong role");
          router.push('/auth/login');
          return;
        }

        console.log("[v0] Profile loaded:", profileData.role);
        setProfile(profileData);

        const { data: issuesData } = await supabase
          .from("issues")
          .select("*")
          .eq("reporter_id", session.user.id)
          .order("created_at", { ascending: false });

        setIssues(issuesData || []);
        console.log("[v0] Issues loaded:", issuesData?.length);
      } catch (error) {
        console.error("[v0] Error loading data:", error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const activeIssues = issues.filter(issue => 
    !['resolved', 'closed'].includes(issue.status)
  );
  const resolvedIssues = issues.filter(issue => 
    ['resolved', 'closed'].includes(issue.status)
  );

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Issues</h1>
            <p className="text-muted-foreground">
              Track and manage your reported civic issues
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/citizen/report">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Reported</CardDescription>
              <CardTitle className="text-3xl">{issues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Issues</CardDescription>
              <CardTitle className="text-3xl">{activeIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-3xl">{resolvedIssues.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Issues List */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Active ({activeIssues.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedIssues.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {activeIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    No active issues. Report a new issue to get started.
                  </p>
                  <Button asChild>
                    <Link href="/citizen/report">Report Issue</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/citizen/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="mt-6">
            {resolvedIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No resolved issues yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolvedIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/citizen/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
