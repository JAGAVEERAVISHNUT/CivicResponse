'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueCard } from "@/components/issue-card";
import { AlertCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Issue, Profile } from "@/lib/types";

export default function L1DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUserId(user.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileData || profileData.role !== 'l1_officer') {
          router.push('/auth/login');
          return;
        }

        setProfile(profileData);

        const { data: allIssues } = await supabase
          .from("issues")
          .select('*')
          .order("created_at", { ascending: false });

        const issuesData = allIssues || [];
        
        // Fetch all related profiles
        const profileIds = new Set<string>();
        issuesData.forEach(issue => {
          if (issue.reporter_id) profileIds.add(issue.reporter_id);
          if (issue.assigned_l1_id) profileIds.add(issue.assigned_l1_id);
          if (issue.assigned_l2_id) profileIds.add(issue.assigned_l2_id);
        });

        const { data: profiles } = await supabase
          .from("profiles")
          .select('*')
          .in('id', Array.from(profileIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Attach profile data to issues
        const issuesWithProfiles = issuesData.map(issue => ({
          ...issue,
          reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) : null,
          assigned_l1: issue.assigned_l1_id ? profileMap.get(issue.assigned_l1_id) : null,
          assigned_l2: issue.assigned_l2_id ? profileMap.get(issue.assigned_l2_id) : null,
        }));

        setIssues(issuesWithProfiles);
      } catch (error) {
        console.error("[v0] Error loading data:", error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  if (loading || !profile || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter issues by status
  const submittedIssues = issues.filter(issue => issue.status === 'submitted');
  const myIssues = issues.filter(issue => issue.assigned_l1_id === userId);
  const assignedToL2 = issues.filter(issue => 
    issue.assigned_l1_id === userId && issue.assigned_l2_id !== null
  );
  
  // Check for overdue issues
  const now = new Date();
  const overdueIssues = issues.filter(issue => {
    if (!issue.sla_deadline) return false;
    return new Date(issue.sla_deadline) < now && !['resolved', 'closed'].includes(issue.status);
  });

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">L1 Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Review, assign, and manage reported civic issues
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <CardDescription>New Submissions</CardDescription>
              </div>
              <CardTitle className="text-3xl">{submittedIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <CardDescription>My Assignments</CardDescription>
              </div>
              <CardTitle className="text-3xl">{myIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardDescription>Assigned to L2</CardDescription>
              </div>
              <CardTitle className="text-3xl">{assignedToL2.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardDescription>Overdue Issues</CardDescription>
              </div>
              <CardTitle className="text-3xl text-destructive">{overdueIssues.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Issues Tabs */}
        <Tabs defaultValue="submitted" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="submitted">
              New ({submittedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="my-issues">
              My Issues ({myIssues.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueIssues.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="submitted" className="mt-6">
            {submittedIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-muted-foreground">No new submissions.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submittedIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l1-dashboard/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-issues" className="mt-6">
            {myIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No issues assigned to you yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l1-dashboard/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues.map((issue: Issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  href={`/l1-dashboard/issues/${issue.id}`}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overdue" className="mt-6">
            {overdueIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-muted-foreground">No overdue issues. Great work!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l1-dashboard/issues/${issue.id}`}
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
