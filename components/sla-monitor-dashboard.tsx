"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Issue } from '@/lib/types';
import { getPriorityColor, getStatusColor, formatStatus, formatPriority, getTimeRemaining } from '@/lib/utils/issue-helpers';
import { Loader2, Play, AlertTriangle, Bell } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface SLAMonitorDashboardProps {
  overdueIssues: Issue[];
  urgentIssues: Issue[];
  escalatedIssues: Issue[];
}

export function SLAMonitorDashboard({ overdueIssues, urgentIssues, escalatedIssues }: SLAMonitorDashboardProps) {
  const [isEscalating, setIsEscalating] = useState(false);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEscalate = async () => {
    setIsEscalating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/escalate-issues', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to escalate issues' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSendNotifications = async () => {
    setIsSendingNotifications(true);
    setMessage(null);

    try {
      const response = await fetch('/api/send-notifications', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send notifications' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSendingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleEscalate}
              disabled={isEscalating || overdueIssues.length === 0}
              variant="destructive"
              className="flex-1"
            >
              {isEscalating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Escalate Overdue Issues
            </Button>
            <Button 
              onClick={handleSendNotifications}
              disabled={isSendingNotifications || urgentIssues.length === 0}
              variant="secondary"
              className="flex-1"
            >
              {isSendingNotifications ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Send Urgent Notifications
            </Button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Lists */}
      <Tabs defaultValue="overdue" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="overdue">
            Overdue ({overdueIssues.length})
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({urgentIssues.length})
          </TabsTrigger>
          <TabsTrigger value="escalated">
            Escalated ({escalatedIssues.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No overdue issues
                </p>
              ) : (
                <div className="space-y-4">
                  {overdueIssues.map((issue) => {
                    const timeRemaining = issue.sla_deadline ? getTimeRemaining(issue.sla_deadline) : null;
                    return (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge className={`${getStatusColor(issue.status)} border`}>
                            {formatStatus(issue.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                            {formatPriority(issue.priority)}
                          </Badge>
                          {timeRemaining && (
                            <Badge variant="destructive">
                              {timeRemaining.text}
                            </Badge>
                          )}
                          {issue.escalation_count > 0 && (
                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                              Escalated {issue.escalation_count}x
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Reported: {format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/issues/${issue.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Urgent Issues (Under 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {urgentIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No urgent issues
                </p>
              ) : (
                <div className="space-y-4">
                  {urgentIssues.map((issue) => {
                    const timeRemaining = issue.sla_deadline ? getTimeRemaining(issue.sla_deadline) : null;
                    return (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge className={`${getStatusColor(issue.status)} border`}>
                            {formatStatus(issue.status)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                            {formatPriority(issue.priority)}
                          </Badge>
                          {timeRemaining && (
                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                              {timeRemaining.text}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Deadline: {format(new Date(issue.sla_deadline!), 'MMM dd, HH:mm')}</span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/issues/${issue.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalated" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Escalated Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {escalatedIssues.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No escalated issues
                </p>
              ) : (
                <div className="space-y-4">
                  {escalatedIssues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <Badge className={`${getStatusColor(issue.status)} border`}>
                          {formatStatus(issue.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                          {formatPriority(issue.priority)}
                        </Badge>
                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                          Escalated {issue.escalation_count}x
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Reported: {format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/issues/${issue.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
