"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Issue, IssueStatus } from '@/lib/types';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import { formatStatus } from '@/lib/utils/issue-helpers';

interface L2IssueActionsProps {
  issue: Issue;
}

export function L2IssueActions({ issue }: L2IssueActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>(issue.status);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  const handleStartWork = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
        status: 'in_progress',
      })
      .eq('id', issue.id);

    if (!error) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      alert('Please provide resolution details');
      return;
    }

    setIsUpdating(true);
    const supabase = createClient();
    
    // Update issue status
    const { error: updateError } = await supabase
      .from('issues')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', issue.id);

    if (updateError) {
      setIsUpdating(false);
      return;
    }

    // Add resolution comment
    const { error: commentError } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issue.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        comment: `Issue Resolved:\n\n${resolutionNote}`,
        is_internal: false,
      });

    if (!commentError) {
      router.refresh();
    }
    setIsUpdating(false);
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issues')
      .update({
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
        {issue.status === 'assigned_l2' || issue.status === 'escalated' ? (
          <Button 
            onClick={handleStartWork} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Working
          </Button>
        ) : null}

        {issue.status === 'in_progress' && !showResolutionForm ? (
          <Button 
            onClick={() => setShowResolutionForm(true)} 
            variant="default"
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Resolved
          </Button>
        ) : null}

        {showResolutionForm && (
          <div className="space-y-3 p-4 border rounded-lg">
            <Label>Resolution Details *</Label>
            <Textarea
              placeholder="Describe how the issue was resolved..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowResolutionForm(false)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleResolve}
                disabled={isUpdating || !resolutionNote.trim()}
                size="sm"
                className="flex-1"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm
              </Button>
            </div>
          </div>
        )}

        {!showResolutionForm && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Update Status
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as IssueStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned_l2">{formatStatus('assigned_l2')}</SelectItem>
                  <SelectItem value="in_progress">{formatStatus('in_progress')}</SelectItem>
                  <SelectItem value="resolved">{formatStatus('resolved')}</SelectItem>
                  <SelectItem value="escalated">{formatStatus('escalated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStatus !== issue.status && (
              <Button 
                onClick={handleUpdateStatus} 
                disabled={isUpdating}
                variant="secondary"
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Update Status
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
