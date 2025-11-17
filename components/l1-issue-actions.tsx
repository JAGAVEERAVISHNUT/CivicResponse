"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Issue, Profile, IssuePriority, IssueStatus } from '@/lib/types';
import { Loader2, UserCheck, Send } from 'lucide-react';
import { formatPriority, formatStatus } from '@/lib/utils/issue-helpers';

interface L1IssueActionsProps {
  issue: Issue;
  currentUserId: string;
  l2Officers: Profile[];
}

export function L1IssueActions({ issue, currentUserId, l2Officers }: L1IssueActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedL2, setSelectedL2] = useState<string>(issue.assigned_l2_id || '');
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority>(issue.priority);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);

  const handleAssignToSelf = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
        assigned_l1_id: currentUserId,
        assigned_l1_at: new Date().toISOString(),
        status: 'assigned_l1',
      })
      .eq('id', issue.id);

    if (!error) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleAssignToL2 = async () => {
    if (!selectedL2) return;
    
    setIsUpdating(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
        assigned_l2_id: selectedL2,
        assigned_l2_at: new Date().toISOString(),
        status: 'assigned_l2',
      })
      .eq('id', issue.id);

    if (!error) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleUpdateIssue = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
        priority: selectedPriority,
        status: selectedStatus,
      })
      .eq('id', issue.id);

    if (!error) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!issue.assigned_l1_id && (
          <Button 
            onClick={handleAssignToSelf} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Assign to Me
          </Button>
        )}

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

        {(selectedPriority !== issue.priority || selectedStatus !== issue.status) && (
          <Button 
            onClick={handleUpdateIssue} 
            disabled={isUpdating}
            variant="secondary"
            className="w-full"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Update Issue
          </Button>
        )}

        {issue.assigned_l1_id && !issue.assigned_l2_id && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Assign to L2 Officer
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select L2 Officer</Label>
              <Select value={selectedL2} onValueChange={setSelectedL2}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an officer..." />
                </SelectTrigger>
                <SelectContent>
                  {l2Officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.full_name} - {officer.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAssignToL2} 
              disabled={isUpdating || !selectedL2}
              className="w-full"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Assign to L2
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
