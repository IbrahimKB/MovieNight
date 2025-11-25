'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Shield, RotateCcw, Plus, Users, Film, Heart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  joinedAt: string;
}

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalMovies: number;
  totalSuggestions: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.data?.user || data.data.user.role !== 'admin') {
        router.push('/');
        return;
      }

      setAuthorized(true);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch stats');
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success(`Deleted user ${username}`);
        await fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Error deleting user');
    }
  };

  const promoteToAdmin = async (userId: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/promote`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success(`Promoted ${username} to admin`);
        await fetchUsers();
        await fetchStats();
      } else {
        toast.error(data.error || 'Failed to promote user');
      }
    } catch (err) {
      toast.error('Error promoting user');
    }
  };

  const resetPassword = async (userId: string, username: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success(`Reset password for ${username}. Temporary password: ${data.temporaryPassword}`);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Error resetting password');
    }
  };

  if (!loading && !authorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Admin Users',
      value: stats?.totalAdmins || 0,
      icon: Shield,
      description: 'Administrator accounts',
    },
    {
      title: 'Total Movies',
      value: stats?.totalMovies || 0,
      icon: Film,
      description: 'Movies in catalog',
    },
    {
      title: 'Suggestions',
      value: stats?.totalSuggestions || 0,
      icon: Heart,
      description: 'Movie suggestions',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage MovieNight users and system settings</p>
          </div>
          <Badge variant="default" className="text-sm">
            Administrator
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email to promote to admin"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        const user = users.find((u) => u.email === newAdminEmail);
                        if (user) {
                          promoteToAdmin(user.id, user.username);
                          setNewAdminEmail('');
                        } else {
                          toast.error('User not found');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Promote
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-3">Username</th>
                          <th className="text-left py-2 px-3">Email</th>
                          <th className="text-left py-2 px-3">Name</th>
                          <th className="text-left py-2 px-3">Role</th>
                          <th className="text-left py-2 px-3">Joined</th>
                          <th className="text-left py-2 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 font-medium">{user.username}</td>
                            <td className="py-2 px-3">{user.email}</td>
                            <td className="py-2 px-3">{user.name || '-'}</td>
                            <td className="py-2 px-3">
                              <Badge
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className={user.role === 'admin' ? 'bg-red-600' : ''}
                              >
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-xs">
                              {new Date(user.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-2">
                                {user.role !== 'admin' && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" title="Promote to Admin">
                                        <Shield className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will give {user.username} admin privileges.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => promoteToAdmin(user.id, user.username)}
                                        >
                                          Promote
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" title="Reset Password">
                                      <RotateCcw className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Generate a temporary password for {user.username}.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => resetPassword(user.id, user.username)}
                                      >
                                        Reset
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" title="Delete User">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete {user.username} and all associated data.
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => deleteUser(user.id, user.username)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No users found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <p className="font-medium mb-2">Database Management</p>
                      <p className="text-sm">
                        Connect directly to PostgreSQL to perform advanced operations:
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
{`psql -h localhost -U postgres -d boksh_apps
Password: SuperSecurePassword123`}
                      </pre>
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3">Quick SQL Commands</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium">Make user admin:</p>
                        <code className="text-xs bg-muted p-2 rounded block mt-1">
                          UPDATE users SET role = 'admin' WHERE username = 'your_username';
                        </code>
                      </div>
                      <div>
                        <p className="font-medium">View all users:</p>
                        <code className="text-xs bg-muted p-2 rounded block mt-1">
                          SELECT id, username, email, role FROM users;
                        </code>
                      </div>
                      <div>
                        <p className="font-medium">Delete all test data:</p>
                        <code className="text-xs bg-muted p-2 rounded block mt-1">
                          DELETE FROM users WHERE role = 'user';
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
