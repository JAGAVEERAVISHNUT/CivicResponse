'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { NavHeader } from "@/components/nav-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStatsCards } from "@/components/admin-stats-cards";
import { AdminIssuesTable } from "@/components/admin-issues-table";
import { AdminUsersTable } from "@/components/admin-users-table";
import { CreateOfficerDialog } from "@/components/create-officer-dialog";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import { PromoteToAdminDialog } from "@/components/promote-to-admin-dialog";
import { Profile } from "@/lib/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [promotingUser, setPromotingUser] = useState<Profile | null>(null);

  const loadData = async () => {
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

      if (!profileData || profileData.role !== 'admin') {
        router.push('/auth/login');
        return;
      }

      setProfile(profileData);

      const { data: allIssues } = await supabase
        .from("issues")
        .select('*')
        .order("created_at", { ascending: false });

      const issuesData = allIssues || [];
      
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

      const issuesWithProfiles = issuesData.map(issue => ({
        ...issue,
        reporter: issue.reporter_id ? profileMap.get(issue.reporter_id) : null,
        assigned_l1: issue.assigned_l1_id ? profileMap.get(issue.assigned_l1_id) : null,
        assigned_l2: issue.assigned_l2_id ? profileMap.get(issue.assigned_l2_id) : null,
      }));

      setIssues(issuesWithProfiles);

      const { data: allUsers } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers(allUsers || []);
    } catch (error) {
      console.error("[v0] Error loading data:", error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router, supabase]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setCreateDialogOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setCreateDialogOpen(true);
  };

  const handleDeleteUser = (user: Profile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handlePromoteToAdmin = (user: Profile) => {
    setPromotingUser(user);
    setPromoteDialogOpen(true);
  };

  const handleUserActionSuccess = () => {
    loadData();
  };

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

  const now = new Date();
  const overdueIssues = issues.filter(issue => {
    if (!issue.sla_deadline) return false;
    return new Date(issue.sla_deadline) < now && !['resolved', 'closed'].includes(issue.status);
  });

  const activeIssues = issues.filter(issue => 
    !['resolved', 'closed'].includes(issue.status)
  );

  const resolvedIssues = issues.filter(issue => 
    ['resolved', 'closed'].includes(issue.status)
  );

  const escalatedIssues = issues.filter(issue => 
    issue.escalation_count > 0 || issue.status === 'escalated'
  );

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and management console
          </p>
        </div>

        <AdminStatsCards 
          totalIssues={issues.length}
          activeIssues={activeIssues.length}
          resolvedIssues={resolvedIssues.length}
          overdueIssues={overdueIssues.length}
          escalatedIssues={escalatedIssues.length}
          totalUsers={users.length}
          citizens={users.filter(u => u.role === 'citizen').length}
          officers={users.filter(u => u.role === 'l1_officer' || u.role === 'l2_officer').length}
        />

        <Tabs defaultValue="issues" className="w-full mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="issues">Issues Management</TabsTrigger>
            <TabsTrigger value="users">Users Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="mt-6">
            <AdminIssuesTable issues={issues} />
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <AdminUsersTable 
              users={users} 
              onCreateUser={handleCreateUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onPromoteToAdmin={handlePromoteToAdmin}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CreateOfficerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleUserActionSuccess}
        editingUser={editingUser}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={deletingUser}
        onSuccess={handleUserActionSuccess}
      />

      <PromoteToAdminDialog
        open={promoteDialogOpen}
        onOpenChange={setPromoteDialogOpen}
        user={promotingUser}
        onSuccess={handleUserActionSuccess}
      />
    </div>
  );
}
