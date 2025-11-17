"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { IssueComment, UserRole } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, Send } from 'lucide-react';

interface IssueCommentSectionProps {
  issueId: string;
  userId: string;
  userRole: UserRole;
}

export function IssueCommentSection({ issueId, userId, userRole }: IssueCommentSectionProps) {
  const [comments, setComments] = useState<(IssueComment & { user: any })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [issueId]);

  const loadComments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('issue_comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (data) {
      // Filter internal comments for citizens
      const filteredComments = userRole === 'citizen' 
        ? data.filter(c => !c.is_internal)
        : data;
      setComments(filteredComments);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: issueId,
        user_id: userId,
        comment: newComment,
        is_internal: false,
      });

    if (!error) {
      setNewComment('');
      loadComments();
    }
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{comment.user?.full_name || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {comment.is_internal && (
                    <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                      Internal
                    </span>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Post Comment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
