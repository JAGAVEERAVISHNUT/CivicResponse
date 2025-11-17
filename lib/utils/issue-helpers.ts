import { IssuePriority, IssueStatus } from "@/lib/types";

export function getPriorityColor(priority: IssuePriority): string {
  switch (priority) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
  }
}

export function getStatusColor(status: IssueStatus): string {
  switch (status) {
    case 'submitted':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'assigned_l1':
    case 'assigned_l2':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'in_progress':
      return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    case 'resolved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'closed':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'escalated':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

export function formatStatus(status: IssueStatus): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function formatPriority(priority: IssuePriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatCategory(category: string): string {
  return category.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function getTimeRemaining(deadline: string): { text: string; isOverdue: boolean } {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff < 0) {
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    return { text: `${hours}h overdue`, isOverdue: true };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return { text: `${hours}h remaining`, isOverdue: false };
  }
  
  const days = Math.floor(hours / 24);
  return { text: `${days}d remaining`, isOverdue: false };
}

export async function autoAssignToL1(supabase: any, issueId: string) {
  try {
    console.log('[v0] Starting auto-assignment to L1 officer for issue:', issueId);
    
    // Get all active L1 officers
    const { data: l1Officers, error: officersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'l1_officer');

    if (officersError) {
      console.error('[v0] Error fetching L1 officers:', officersError);
      return null;
    }

    if (!l1Officers || l1Officers.length === 0) {
      console.log('[v0] No L1 officers available for assignment');
      return null;
    }

    console.log('[v0] Found', l1Officers.length, 'L1 officers');

    // Get the L1 officer with the least number of active assignments (load balancing)
    const { data: assignmentCounts, error: countError } = await supabase
      .from('issues')
      .select('assigned_l1_id')
      .in('assigned_l1_id', l1Officers.map((o: any) => o.id))
      .in('status', ['assigned_l1', 'assigned_l2', 'in_progress']);

    if (countError) {
      console.error('[v0] Error counting assignments:', countError);
      // Fallback to first officer if counting fails
      return l1Officers[0].id;
    }

    // Count assignments per officer
    const assignmentMap = new Map<string, number>();
    l1Officers.forEach((officer: any) => {
      assignmentMap.set(officer.id, 0);
    });

    if (assignmentCounts) {
      assignmentCounts.forEach((issue: any) => {
        if (issue.assigned_l1_id) {
          const current = assignmentMap.get(issue.assigned_l1_id) || 0;
          assignmentMap.set(issue.assigned_l1_id, current + 1);
        }
      });
    }

    // Find officer with least assignments
    let selectedOfficerId = l1Officers[0].id;
    let minAssignments = assignmentMap.get(selectedOfficerId) || 0;

    assignmentMap.forEach((count, officerId) => {
      if (count < minAssignments) {
        minAssignments = count;
        selectedOfficerId = officerId;
      }
    });

    console.log('[v0] Selected L1 officer:', selectedOfficerId, 'with', minAssignments, 'active assignments');

    // Assign the issue to the selected L1 officer
    const { error: updateError } = await supabase
      .from('issues')
      .update({
        assigned_l1_id: selectedOfficerId,
        status: 'assigned_l1',
        assigned_l1_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', issueId);

    if (updateError) {
      console.error('[v0] Error assigning issue to L1:', updateError);
      return null;
    }

    // Log the assignment activity
    await supabase.from('activity_log').insert({
      issue_id: issueId,
      user_id: selectedOfficerId,
      action: 'auto_assigned_l1',
      details: { officer_id: selectedOfficerId }
    });

    console.log('[v0] Successfully auto-assigned issue to L1 officer');
    return selectedOfficerId;

  } catch (err) {
    console.error('[v0] Error in autoAssignToL1:', err);
    return null;
  }
}
