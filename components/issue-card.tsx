import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Issue } from "@/lib/types";
import { getPriorityColor, getStatusColor, formatStatus, formatPriority, formatCategory, getTimeRemaining } from "@/lib/utils/issue-helpers";
import { MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface IssueCardProps {
  issue: Issue;
  href: string;
}

export function IssueCard({ issue, href }: IssueCardProps) {
  const timeRemaining = issue.sla_deadline ? getTimeRemaining(issue.sla_deadline) : null;

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg line-clamp-1">{issue.title}</h3>
              <Badge className={`${getStatusColor(issue.status)} border`}>
                {formatStatus(issue.status)}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {issue.description}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                {formatPriority(issue.priority)}
              </Badge>
              <Badge variant="outline">
                {formatCategory(issue.category)}
              </Badge>
            </div>

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{issue.address || `${issue.latitude}, ${issue.longitude}`}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className={timeRemaining.isOverdue ? 'text-destructive font-medium' : ''}>
                    {timeRemaining.text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
