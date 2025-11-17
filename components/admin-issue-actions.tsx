"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Issue, Profile, IssuePriority, IssueStatus } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { formatPriority, formatStatus } from '@/lib/utils/issue-helpers';

interface AdminIssueActionsProps {
  issue: Issue;
  l1Officers: Profile[];
  l2Officers: Profile[];
}

export function AdminIssueActions({ issue, l1Officers, l2Officers }: AdminIssueActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedL1, setSelectedL1] = useState<string>(issue.assigned_l1_id || 'unassigned');
  const [selectedL2, setSelectedL2] = useState<string>(issue.assigned_l2_id || 'unassigned');
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority>(issue.priority);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    
    const updates: any = {
      priority: selectedPriority,
      status: selectedStatus,
    };

    const l1Value = selectedL1 === 'unassigned' ? null : selectedL1;
    const l2Value = selectedL2 === 'unassigned' ? null : selectedL2;

    if (l1Value !== issue.assigned_l1_id) {
      updates.assigned_l1_id = l1Value;
      if (l1Value) {
        updates.assigned_l1_at = new Date().toISOString();
      }
    }

    if (l2Value !== issue.assigned_l2_id) {
      updates.assigned_l2_id = l2Value;
      if (l2Value) {
        updates.assigned_l2_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issue.id);

    if (!error) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  const hasChanges = selectedL1 !== (issue.assigned_l1_id || 'unassigned') ||
                    selectedL2 !== (issue.assigned_l2_id || 'unassigned') ||
                    selectedPriority !== issue.priority ||
                    selectedStatus !== issue.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>L1 Officer</Label>
          <Select value={selectedL1} onValueChange={setSelectedL1}>
            <SelectTrigger>
              <SelectValue placeholder="Assign L1 Officer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {l1Officers.map((officer) => (
                <SelectItem key={officer.id} value={officer.id}>
                  {officer.full_name} - {officer.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>L2 Officer</Label>
          <Select value={selectedL2} onValueChange={setSelectedL2}>
            <SelectTrigger>
              <SelectValue placeholder="Assign L2 Officer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {l2Officers.map((officer) => (
                <SelectItem key={officer.id} value={officer.id}>
                  {officer.full_name} - {officer.department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={selectedPriority} onValueChange={(val) => setSelectedPriority(val as IssuePriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{formatPriority('low')}</SelectItem>
              <SelectItem value="medium">{formatPriority('medium')}</SelectItem>
              <SelectItem value="high">{formatPriority('high')}</SelectItem>
              <SelectItem value="critical">{formatPriority('critical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as IssueStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">{formatStatus('submitted')}</SelectItem>
              <SelectItem value="assigned_l1">{formatStatus('assigned_l1')}</SelectItem>
              <SelectItem value="assigned_l2">{formatStatus('assigned_l2')}</SelectItem>
              <SelectItem value="in_progress">{formatStatus('in_progress')}</SelectItem>
              <SelectItem value="resolved">{formatStatus('resolved')}</SelectItem>
              <SelectItem value="closed">{formatStatus('closed')}</SelectItem>
              <SelectItem value="escalated">{formatStatus('escalated')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasChanges && (
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
