"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { LogOut, User, Shield, Home, Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavHeaderProps {
  userName: string;
  role: string;
}

export function NavHeader({ userName, role }: NavHeaderProps) {
  const router = useRouter();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (role === 'citizen') {
      loadPendingRequests();
    }
  }, [role]);

  async function loadPendingRequests() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data } = await supabase
        .from("promotion_requests")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "pending");
      
      setPendingRequestsCount(data?.length || 0);
    }
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const getHomeUrl = () => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'l1_officer':
        return '/l1-dashboard';
      case 'l2_officer':
        return '/l2-dashboard';
      case 'citizen':
        return '/citizen';
      default:
        return '/';
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={getHomeUrl()} className="text-xl font-bold">
            CivicResponse
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={getHomeUrl()}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {role === 'citizen' && (
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link href="/citizen/requests">
                <Bell className="h-4 w-4 mr-2" />
                Requests
                {pendingRequestsCount > 0 && (
                  <Badge className="ml-2 bg-orange-600 hover:bg-orange-700 h-5 min-w-5 flex items-center justify-center p-1">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}
          
          {role === 'admin' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/sla-monitor">
                <Shield className="h-4 w-4 mr-2" />
                SLA Monitor
              </Link>
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground capitalize">{role.replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
