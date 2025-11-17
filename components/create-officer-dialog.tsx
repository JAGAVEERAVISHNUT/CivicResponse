"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

interface CreateOfficerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingUser?: Profile | null;
}

export function CreateOfficerDialog({ open, onOpenChange, onSuccess, editingUser }: CreateOfficerDialogProps) {
  const [email, setEmail] = useState(editingUser?.email || '');
  const [fullName, setFullName] = useState(editingUser?.full_name || '');
  const [phone, setPhone] = useState(editingUser?.phone || '');
  const [department, setDepartment] = useState(editingUser?.department || '');
  const [role, setRole] = useState<'l1_officer' | 'l2_officer'>(
    (editingUser?.role as 'l1_officer' | 'l2_officer') || 'l1_officer'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone,
            department: department,
            role: role,
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
      } else {
        // Create new user - this would typically be done through admin API
        // For now, we'll create a profile entry manually
        // Note: In production, you'd need to use Supabase Admin API to create auth users
        
        if (!password) {
          setError('Password is required for new officers');
          setIsLoading(false);
          return;
        }

        // Create auth user (this will trigger the profile creation via trigger)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              department: department,
              role: role
            }
          }
        });

        if (authError) throw authError;

        // Wait a bit for the trigger to create the profile, then update it
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (authData.user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              phone: phone,
              department: department,
              role: role,
            })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;
        }
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setEmail('');
      setFullName('');
      setPhone('');
      setDepartment('');
      setRole('l1_officer');
      setPassword('');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Edit Officer' : 'Create New Officer'}
          </DialogTitle>
          <DialogDescription>
            {editingUser 
              ? 'Update the officer information below.' 
              : 'Create a new municipal officer account (L1 or L2).'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Officer Level</Label>
              <Select value={role} onValueChange={(value) => setRole(value as 'l1_officer' | 'l2_officer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="l1_officer">Level 1 Officer (Review & Assign)</SelectItem>
                  <SelectItem value="l2_officer">Level 2 Officer (Field Resolution)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@city.gov"
                required
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secure password"
                  required
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Public Works, Sanitation, etc."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (editingUser ? 'Update Officer' : 'Create Officer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
