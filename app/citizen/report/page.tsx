import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
import { ReportIssueForm } from "@/components/report-issue-form";

export default async function ReportIssuePage() {
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

  if (!profile || profile.role !== 'citizen') {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader userName={profile.full_name} role={profile.role} />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Report an Issue</h1>
          <p className="text-muted-foreground">
            Help improve your community by reporting civic issues
          </p>
        </div>

        <ReportIssueForm userId={user.id} />
      </div>
    </div>
  );
}
