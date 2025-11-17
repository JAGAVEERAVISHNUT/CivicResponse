import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle, AlertTriangle, Users, Shield, User } from 'lucide-react';

interface AdminStatsCardsProps {
  totalIssues: number;
  activeIssues: number;
  resolvedIssues: number;
  overdueIssues: number;
  escalatedIssues: number;
  totalUsers: number;
  citizens: number;
  officers: number;
}

export function AdminStatsCards({
  totalIssues,
  activeIssues,
  resolvedIssues,
  overdueIssues,
  escalatedIssues,
  totalUsers,
  citizens,
  officers,
}: AdminStatsCardsProps) {
  const resolutionRate = totalIssues > 0 
    ? ((resolvedIssues / totalIssues) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <CardDescription>Total Issues</CardDescription>
          </div>
          <CardTitle className="text-3xl">{totalIssues}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {activeIssues} active, {resolvedIssues} resolved
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <CardDescription>Resolution Rate</CardDescription>
          </div>
          <CardTitle className="text-3xl">{resolutionRate}%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {resolvedIssues} of {totalIssues} resolved
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardDescription>Overdue Issues</CardDescription>
          </div>
          <CardTitle className="text-3xl text-destructive">{overdueIssues}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {escalatedIssues} escalated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <CardDescription>Total Users</CardDescription>
          </div>
          <CardTitle className="text-3xl">{totalUsers}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {citizens} citizens, {officers} officers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
