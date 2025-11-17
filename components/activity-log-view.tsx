"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLog } from '@/lib/types';
import { format } from 'date-fns';
import { Loader2, Activity } from 'lucide-react';

interface ActivityLogViewProps {
  issueId: string;
}

export function ActivityLogView({ issueId }: ActivityLogViewProps) {
  const [activities, setActivities] = useState<(ActivityLog & { user: any })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [issueId]);

  const loadActivities = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('activity_log')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (data) {
      setActivities(data);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <CardTitle>Activity Log</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-muted pl-4 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm">
                    {activity.action.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.created_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
                {activity.user && (
                  <p className="text-xs text-muted-foreground mb-1">
                    by {activity.user.full_name}
                  </p>
                )}
                {activity.details && (
                  <pre className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
