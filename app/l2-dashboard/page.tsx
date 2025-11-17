'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IssueCard } from "@/components/issue-card";
import { Clock, CheckCircle, AlertTriangle, Wrench } from 'lucide-react';
import { Issue, Profile } from "@/lib/types";

export default function L2DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileData || profileData.role !== 'l2_officer') {
          router.push('/auth/login');
          return;
        }

        setProfile(profileData);

        const { data: myIssues } = await supabase
          .from("issues")
          .select('*')
          .eq("assigned_l2_id", user.id)
          .order("created_at", { ascending: false });

        const issuesData = myIssues || [];
        
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

  // Filter issues by status
  const assignedIssues = issues.filter(issue => 
    issue.status === 'assigned_l2' || issue.status === 'escalated'
  );
  const inProgressIssues = issues.filter(issue => issue.status === 'in_progress');
  const resolvedIssues = issues.filter(issue => 
    issue.status === 'resolved' || issue.status === 'closed'
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
          <h1 className="text-3xl font-bold mb-2">L2 Officer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and resolve field issues assigned to you
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardDescription>New Assignments</CardDescription>
              </div>
              <CardTitle className="text-3xl">{assignedIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-indigo-600" />
                <CardDescription>In Progress</CardDescription>
              </div>
              <CardTitle className="text-3xl">{inProgressIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardDescription>Resolved</CardDescription>
              </div>
              <CardTitle className="text-3xl">{resolvedIssues.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardDescription>Overdue</CardDescription>
              </div>
              <CardTitle className="text-3xl text-destructive">{overdueIssues.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Issues Tabs */}
        <Tabs defaultValue="assigned" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="assigned">
              Assigned ({assignedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({inProgressIssues.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueIssues.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned" className="mt-6">
            {assignedIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-muted-foreground">No new assignments.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l2-dashboard/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            {inProgressIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No issues in progress.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l2-dashboard/issues/${issue.id}`}
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
                    href={`/l2-dashboard/issues/${issue.id}`}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-6">
            {overdueIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-muted-foreground">No overdue issues. Excellent work!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueIssues.map((issue: Issue) => (
                  <IssueCard 
                    key={issue.id} 
                    issue={issue} 
                    href={`/l2-dashboard/issues/${issue.id}`}
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
