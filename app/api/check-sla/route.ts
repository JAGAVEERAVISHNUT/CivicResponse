import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();

    // Find all active issues
    const { data: activeIssues, error: fetchError } = await supabase
      .from('issues')
      .select('*')
      .not('status', 'in', '(resolved,closed)');

    if (fetchError) {
      console.error('[v0] Error fetching active issues:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!activeIssues || activeIssues.length === 0) {
      return NextResponse.json({ 
        totalIssues: 0,
        overdueIssues: 0,
        criticalIssues: 0
      });
    }

    // Calculate SLA metrics
    const overdueIssues = activeIssues.filter(issue => {
      if (!issue.sla_deadline) return false;
      return new Date(issue.sla_deadline) < now;
    });

    const criticalIssues = activeIssues.filter(issue => {
      if (!issue.sla_deadline) return false;
      const deadline = new Date(issue.sla_deadline);
      const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursRemaining > 0 && hoursRemaining < 24 && issue.priority === 'critical';
    });

    const metrics = {
      totalIssues: activeIssues.length,
      overdueIssues: overdueIssues.length,
      criticalIssues: criticalIssues.length,
      overdueList: overdueIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority,
        sla_deadline: issue.sla_deadline,
        hoursOverdue: Math.floor((now.getTime() - new Date(issue.sla_deadline).getTime()) / (1000 * 60 * 60))
      })),
      criticalList: criticalIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        sla_deadline: issue.sla_deadline,
        hoursRemaining: Math.floor((new Date(issue.sla_deadline).getTime() - now.getTime()) / (1000 * 60 * 60))
      }))
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('[v0] SLA Check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
