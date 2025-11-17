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
      <div className="container mx-auto px-4 h-auto min-h-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3 sm:py-0">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Link href={getHomeUrl()} className="text-lg sm:text-xl font-bold truncate">
            CivicResponse
          </Link>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href={getHomeUrl()}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {role === 'citizen' && (
            <Button variant="ghost" size="sm" asChild className="relative">
              <Link href="/citizen/requests">
                <Bell className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Requests</span>
                {pendingRequestsCount > 0 && (
                  <Badge className="ml-1 sm:ml-2 bg-orange-600 hover:bg-orange-700 h-5 min-w-5 flex items-center justify-center p-1">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}
          
          {role === 'admin' && (
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/admin/sla-monitor">
                <Shield className="h-4 w-4 mr-2" />
                SLA Monitor
              </Link>
            </Button>
          )}
          
          <div className="flex items-center gap-2 text-sm min-w-0">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate max-w-[120px] sm:max-w-none">{userName}</span>
              <span className="text-xs text-muted-foreground capitalize truncate">{role.replace('_', ' ')}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-shrink-0">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
