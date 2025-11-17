"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Profile } from '@/lib/types';
import { format } from 'date-fns';
import { Search, UserPlus, Edit, Trash2, Shield } from 'lucide-react';

interface AdminUsersTableProps {
  users: Profile[];
  onCreateUser: () => void;
  onEditUser: (user: Profile) => void;
  onDeleteUser: (user: Profile) => void;
  onPromoteToAdmin: (user: Profile) => void;
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'l2_officer':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'l1_officer':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'citizen':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function formatRole(role: string): string {
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function AdminUsersTable({ users, onCreateUser, onEditUser, onDeleteUser, onPromoteToAdmin }: AdminUsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const citizenCount = users.filter(u => u.role === 'citizen').length;
  const l1Count = users.filter(u => u.role === 'l1_officer').length;
  const l2Count = users.filter(u => u.role === 'l2_officer').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const canPromoteToAdmin = adminCount < 2;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Users</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Citizens: {citizenCount} | L1 Officers: {l1Count} | L2 Officers: {l2Count} | Admins: {adminCount} (max 2)
            </p>
          </div>
          <Button onClick={onCreateUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Officer
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="citizen">Citizen</SelectItem>
              <SelectItem value="l1_officer">L1 Officer</SelectItem>
              <SelectItem value="l2_officer">L2 Officer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.department || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.phone || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== 'admin' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPromoteToAdmin(user)}
                            disabled={!canPromoteToAdmin}
                            title={canPromoteToAdmin ? 'Promote to Admin' : 'Admin limit reached (2 max)'}
                          >
                            <Shield className="h-4 w-4 text-orange-600" />
                          </Button>
                          {(user.role === 'l1_officer' || user.role === 'l2_officer') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </CardContent>
    </Card>
  );
}
