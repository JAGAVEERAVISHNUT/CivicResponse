import { redirect, notFound } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IssueCommentSection } from "@/components/issue-comment-section";
import { IssueImageGallery } from "@/components/issue-image-gallery";
import { getPriorityColor, getStatusColor, formatStatus, formatPriority, formatCategory, getTimeRemaining } from "@/lib/utils/issue-helpers";
import { MapPin, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params;
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

  if (!profile) {
    redirect("/auth/login");
  }

  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select('*')
    .eq("id", id)
    .single();

  if (issueError || !issue) {
    notFound();
  }

  // Check if user has access to this issue
  if (profile.role === 'citizen' && issue.reporter_id !== user.id) {
    redirect("/citizen");
  }

  // Fetch related profiles
  const profileIds = [issue.reporter_id, issue.assigned_l1_id, issue.assigned_l2_id].filter(Boolean);
  const { data: profiles } = await supabase
    .from("profiles")
    .select('*')
    .in('id', profileIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
  
  // Attach profile data to issue
  const issueWithProfiles = {
    ...issue,
    reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) : null,
    assigned_l1: issue.assigned_l1_id ? profileMap.get(issue.assigned_l1_id) : null,
    assigned_l2: issue.assigned_l2_id ? profileMap.get(issue.assigned_l2_id) : null,
  };

  const timeRemaining = issueWithProfiles.sla_deadline ? getTimeRemaining(issueWithProfiles.sla_deadline) : null;

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/citizen">← Back to Dashboard</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Issue Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <CardTitle className="text-2xl">{issueWithProfiles.title}</CardTitle>
                  <Badge className={`${getStatusColor(issueWithProfiles.status)} border`}>
                    {formatStatus(issueWithProfiles.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getPriorityColor(issueWithProfiles.priority)}>
                    {formatPriority(issueWithProfiles.priority)}
                  </Badge>
                  <Badge variant="outline">
                    {formatCategory(issueWithProfiles.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {issueWithProfiles.description}
                  </p>
                </div>

                {issueWithProfiles.images && issueWithProfiles.images.length > 0 && (
                  <>
                    <Separator />
                    <IssueImageGallery images={issueWithProfiles.images} title={issueWithProfiles.title} />
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold">Location</h3>
                  <div className="aspect-video w-full rounded-lg overflow-hidden border">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${issueWithProfiles.longitude-0.01},${issueWithProfiles.latitude-0.01},${issueWithProfiles.longitude+0.01},${issueWithProfiles.latitude+0.01}&layer=mapnik&marker=${issueWithProfiles.latitude},${issueWithProfiles.longitude}`}
                      title="Issue Location"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{issueWithProfiles.address || `${issueWithProfiles.latitude}, ${issueWithProfiles.longitude}`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <IssueCommentSection issueId={issueWithProfiles.id} userId={user.id} userRole={profile.role} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Reported</p>
                    <p className="font-medium">{format(new Date(issueWithProfiles.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>

                {timeRemaining && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">SLA Status</p>
                      <p className={`font-medium ${timeRemaining.isOverdue ? 'text-destructive' : ''}`}>
                        {timeRemaining.text}
                      </p>
                    </div>
                  </div>
                )}

                {issueWithProfiles.escalation_count > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-muted-foreground">Escalations</p>
                      <p className="font-medium">{issueWithProfiles.escalation_count}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Reporter</p>
                    <p className="font-medium">{issueWithProfiles.reporter?.full_name}</p>
                  </div>
                </div>

                {issueWithProfiles.assigned_l1 && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">L1 Officer</p>
                      <p className="font-medium">{issueWithProfiles.assigned_l1.full_name}</p>
                      <p className="text-xs text-muted-foreground">{issueWithProfiles.assigned_l1.department}</p>
                    </div>
                  </div>
                )}

                {issueWithProfiles.assigned_l2 && (
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">L2 Officer</p>
                      <p className="font-medium">{issueWithProfiles.assigned_l2.full_name}</p>
                      <p className="text-xs text-muted-foreground">{issueWithProfiles.assigned_l2.department}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
