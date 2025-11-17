"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from 'lucide-react';
import { Profile } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PromoteToAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
  onSuccess: () => void;
}

export function PromoteToAdminDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: PromoteToAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handlePromote = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Check current admin count
      const { data: admins, error: countError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (countError) throw countError;

      if (admins && admins.length >= 2) {
        setError("Cannot promote: Maximum of 2 admin accounts reached");
        setLoading(false);
        return;
      }

      const { error: requestError } = await supabase
        .from("promotion_requests")
        .insert({
          user_id: user.id,
          requested_by: session.user.id,
          from_role: user.role,
          to_role: "admin",
          status: "pending",
          message: message || null
        });

      if (requestError) throw requestError;

      onSuccess();
      onOpenChange(false);
      setMessage("");
    } catch (err: any) {
      console.error("[v0] Error sending promotion request:", err);
      setError(err.message || "Failed to send promotion request");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Send Admin Promotion Request
          </DialogTitle>
          <DialogDescription>
            This will send a promotion request to the user. They must accept before becoming an admin.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Note:</strong> The user will receive a notification and must accept the promotion
            request. If accepted, they will have full administrative access to the system.
          </AlertDescription>
        </Alert>

        <div className="space-y-2 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">User:</span>
            <span className="font-medium">{user.full_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Role:</span>
            <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Requested Role:</span>
            <span className="font-medium text-orange-600">Admin</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Add a message to the user explaining why they are being promoted..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Sending Request..." : "Send Promotion Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
