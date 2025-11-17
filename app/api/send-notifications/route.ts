import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // Find issues approaching SLA deadline (within 2 hours)
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));

    const { data: urgentIssues, error: fetchError } = await supabase
      .from('issues')
      .select('*')
      .lt('sla_deadline', twoHoursFromNow.toISOString())
      .gt('sla_deadline', now.toISOString())
      .not('status', 'in', '(resolved,closed)');

    if (fetchError) {
      console.error('[v0] Error fetching urgent issues:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!urgentIssues || urgentIssues.length === 0) {
      return NextResponse.json({ 
        message: 'No urgent notifications to send',
        sent: 0
      });
    }

    // In a real implementation, this would send emails or push notifications
    // For now, we'll log notifications and add system comments
    const notificationPromises = urgentIssues.map(async (issue) => {
      const hoursRemaining = Math.floor(
        (new Date(issue.sla_deadline).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      // Add system comment as notification
      await supabase.from('issue_comments').insert({
        issue_id: issue.id,
        user_id: issue.reporter_id,
        comment: `System Alert: SLA deadline approaching in ${hoursRemaining} hour(s). Please prioritize this issue.`,
        is_internal: true
      });

      console.log(`[v0] Notification sent for issue ${issue.id}: ${hoursRemaining}h remaining`);
      
      return issue.id;
    });

    const sentNotifications = await Promise.all(notificationPromises);

    return NextResponse.json({
      message: `Sent ${sentNotifications.length} notification(s)`,
      sent: sentNotifications.length,
      issueIds: sentNotifications
    });

  } catch (error) {
    console.error('[v0] Notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
