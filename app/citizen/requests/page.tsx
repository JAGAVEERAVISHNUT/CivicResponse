'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { NavHeader } from "@/components/nav-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Check, X, Mail, AlertCircle } from 'lucide-react';
import { Profile, PromotionRequest } from "@/lib/types";

export default function PromotionRequestsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profileData) {
        router.push('/auth/login');
        return;
      }

      setProfile(profileData);

      // Load promotion requests
      const { data: requestsData } = await supabase
        .from("promotion_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (requestsData) {
        // Fetch requester profiles
        const requesterIds = requestsData.map(r => r.requested_by);
        const { data: requesters } = await supabase
          .from("profiles")
          .select("*")
          .in("id", requesterIds);

        const requestersMap = new Map(requesters?.map(r => [r.id, r]) || []);
        
        const enrichedRequests = requestsData.map(req => ({
          ...req,
          requester: requestersMap.get(req.requested_by)
        }));

        setRequests(enrichedRequests);
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(requestId: string, toRole: string) {
    setActionLoading(requestId);
    try {
      // Check if accepting admin role and verify limit
      if (toRole === 'admin') {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (admins && admins.length >= 2) {
          alert("Cannot accept: Maximum of 2 admin accounts reached");
          setActionLoading(null);
          return;
        }
      }

      // Update promotion request status
      const { error: updateError } = await supabase
        .from("promotion_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Update user role
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: toRole })
        .eq("id", profile?.id);

      if (roleError) throw roleError;

      // Redirect to new dashboard based on role
      const dashboardMap: Record<string, string> = {
        admin: '/admin',
        l1_officer: '/l1-dashboard',
        l2_officer: '/l2-dashboard',
        citizen: '/citizen'
      };

      router.push(dashboardMap[toRole] || '/citizen');
    } catch (error: any) {
      console.error("[v0] Error accepting promotion:", error);
      alert("Failed to accept promotion: " + error.message);
      setActionLoading(null);
    }
  }

  async function handleReject(requestId: string) {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("promotion_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;

      await loadData();
    } catch (error: any) {
      console.error("[v0] Error rejecting promotion:", error);
      alert("Failed to reject promotion: " + error.message);
    } finally {
      setActionLoading(null);
    }
  }

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

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const handledRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Promotion Requests</h1>
          <p className="text-muted-foreground">
            Review and respond to role promotion requests
          </p>
        </div>

        {/* Pending Requests */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending promotion requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-2 border-orange-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-6 w-6 text-orange-600" />
                          <div>
                            <CardTitle>Admin Role Promotion</CardTitle>
                            <CardDescription>
                              Requested by {request.requester?.full_name || 'Admin'}
                            </CardDescription>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-900">
                          You have been nominated to become an administrator. Accepting will grant you
                          full access to the system including user management and all civic issues.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Role:</span>
                          <span className="font-medium capitalize">{request.from_role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Promoted To:</span>
                          <span className="font-medium text-orange-600 capitalize">{request.to_role}</span>
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium mb-1">Message from Admin:</p>
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleAccept(request.id, request.to_role)}
                          disabled={actionLoading === request.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {actionLoading === request.id ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          variant="outline"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Request History */}
          {handledRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Request History</h2>
              <div className="space-y-3">
                {handledRequests.map((request) => (
                  <Card key={request.id} className="opacity-70">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {request.from_role} → {request.to_role}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.status === 'accepted' ? 'Accepted' : 'Declined'} on{' '}
                              {new Date(request.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'accepted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
