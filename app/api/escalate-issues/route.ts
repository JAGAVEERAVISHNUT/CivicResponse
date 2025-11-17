import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const now = new Date();

    // Find all overdue issues that haven't been resolved
    const { data: overdueIssues, error: fetchError } = await supabase
      .from('issues')
      .select('*')
      .lt('sla_deadline', now.toISOString())
      .not('status', 'in', '(resolved,closed)')
      .order('sla_deadline', { ascending: true });

    if (fetchError) {
      console.error('[v0] Error fetching overdue issues:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!overdueIssues || overdueIssues.length === 0) {
      return NextResponse.json({ 
        message: 'No overdue issues to escalate',
        escalated: 0
      });
    }

    // Escalate each overdue issue
    const escalationPromises = overdueIssues.map(async (issue) => {
      const newEscalationCount = (issue.escalation_count || 0) + 1;
      
      // Update issue with escalation
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          escalation_count: newEscalationCount,
          status: 'escalated',
        })
        .eq('id', issue.id);

      if (updateError) {
        console.error(`[v0] Error escalating issue ${issue.id}:`, updateError);
        return null;
      }

      // Log escalation activity
      await supabase.from('activity_log').insert({
        issue_id: issue.id,
        action: 'auto_escalated',
        details: {
          escalation_count: newEscalationCount,
          sla_deadline: issue.sla_deadline,
          overdue_by_hours: Math.floor((now.getTime() - new Date(issue.sla_deadline).getTime()) / (1000 * 60 * 60))
        }
      });

      // Add system comment
      await supabase.from('issue_comments').insert({
        issue_id: issue.id,
        user_id: issue.reporter_id, // Use reporter as fallback for system comments
        comment: `System: Issue automatically escalated due to SLA breach. Escalation level: ${newEscalationCount}`,
        is_internal: true
      });

      return issue.id;
    });

    const escalatedIssues = await Promise.all(escalationPromises);
    const successCount = escalatedIssues.filter(id => id !== null).length;

    return NextResponse.json({
      message: `Successfully escalated ${successCount} issue(s)`,
      escalated: successCount,
      issueIds: escalatedIssues.filter(id => id !== null)
    });

  } catch (error) {
    console.error('[v0] Escalation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
