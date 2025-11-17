import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SLAMonitorDashboard } from "@/components/sla-monitor-dashboard";
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default async function SLAMonitorPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect("/auth/login");
  }

  const { data: allIssues } = await supabase
    .from("issues")
    .select('*')
    .not('status', 'in', '(resolved,closed)');

  const issues = allIssues || [];
  
  // Fetch all related profiles
  const profileIds = new Set<string>();
  issues.forEach(issue => {
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
  const issuesWithProfiles = issues.map(issue => ({
    ...issue,
    reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) : null,
    assigned_l1: issue.assigned_l1_id ? profileMap.get(issue.assigned_l1_id) : null,
    assigned_l2: issue.assigned_l2_id ? profileMap.get(issue.assigned_l2_id) : null,
  }));

  const now = new Date();

  // Calculate metrics
  const overdueIssues = issuesWithProfiles.filter(issue => {
    if (!issue.sla_deadline) return false;
    return new Date(issue.sla_deadline) < now;
  });

  const urgentIssues = issuesWithProfiles.filter(issue => {
    if (!issue.sla_deadline) return false;
    const hoursRemaining = (new Date(issue.sla_deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining > 0 && hoursRemaining < 24;
  });

  const escalatedIssues = issuesWithProfiles.filter(issue => issue.escalation_count > 0);

  const avgEscalationCount = escalatedIssues.length > 0
    ? (escalatedIssues.reduce((sum, issue) => sum + issue.escalation_count, 0) / escalatedIssues.length).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SLA Monitor & Escalation</h1>
          <p className="text-muted-foreground">
            Track service level agreements and manage automated escalations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardDescription>Overdue Issues</CardDescription>
              </div>
              <CardTitle className="text-3xl text-destructive">{overdueIssues.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardDescription>Urgent (Under 24h)</CardDescription>
              </div>
              <CardTitle className="text-3xl text-orange-600">{urgentIssues.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Approaching deadline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardDescription>Avg. Escalations</CardDescription>
              </div>
              <CardTitle className="text-3xl">{avgEscalationCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Per escalated issue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SLA Dashboard */}
        <SLAMonitorDashboard 
          overdueIssues={overdueIssues}
          urgentIssues={urgentIssues}
          escalatedIssues={escalatedIssues}
        />
      </div>
    </div>
  );
}
