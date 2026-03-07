"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import {
  Shield,
  Users,
  Film,
  Calendar,
  RotateCw,
  Lock,
  Trash2,
  UserMinus,
  UserX,
  UserCheck,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserRole = "user" | "admin" | "super_admin";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  role: UserRole;
  joinedAt: string;
  disabledAt?: string | null;
  deletedAt?: string | null;
}

interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  disabledUsers: number;
  totalMovies: number;
  totalSuggestions: number;
  totalEvents: number;
  queuedPushJobs: number;
  failedPushJobs: number;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  actor?: {
    username: string;
    name?: string | null;
  };
  targetUser?: {
    username: string;
    name?: string | null;
  } | null;
}

type ConfirmIntent =
  | { type: "demote"; user: AdminUser }
  | { type: "revoke"; user: AdminUser }
  | { type: "disable"; user: AdminUser }
  | { type: "enable"; user: AdminUser };

const INITIAL_STATS: AdminStats = {
  totalUsers: 0,
  totalAdmins: 0,
  totalSuperAdmins: 0,
  disabledUsers: 0,
  totalMovies: 0,
  totalSuggestions: 0,
  totalEvents: 0,
  queuedPushJobs: 0,
  failedPushJobs: 0,
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats>(INITIAL_STATS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncingMovies, setSyncingMovies] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("PASSWORD123");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [adminPassword, setAdminPassword] = useState("");

  const fetchAdminData = useCallback(async () => {
    const [usersRes, statsRes, auditRes] = await Promise.all([
      fetch("/api/admin/users", { credentials: "include" }),
      fetch("/api/admin/stats", { credentials: "include" }),
      fetch("/api/admin/audit?limit=20", { credentials: "include" }),
    ]);

    const [usersData, statsData, auditData] = await Promise.all([
      usersRes.json(),
      statsRes.json(),
      auditRes.json(),
    ]);

    if (usersData.success && Array.isArray(usersData.data)) {
      setUsers(usersData.data);
    } else {
      throw new Error(usersData.error || "Failed to load users");
    }

    if (statsData.success && statsData.data) {
      setStats((prev) => ({ ...prev, ...statsData.data }));
    } else {
      throw new Error(statsData.error || "Failed to load stats");
    }

    if (auditData.success && Array.isArray(auditData.data)) {
      setAuditLogs(auditData.data);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/");
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        await fetchAdminData();
      } catch (error: any) {
        console.error("Failed to fetch admin data:", error);
        toast({
          title: "Failed to load admin data",
          description: error?.message || "Try again in a moment.",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [fetchAdminData, isAdmin, router]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await action();
      await fetchAdminData();
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncMovies = async () => {
    setSyncingMovies(true);
    try {
      const res = await fetch("/api/cron/init", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to sync movies");
      }

      await fetchAdminData();
      toast({
        title: "Sync started",
        description: "Movie and release sync completed.",
      });
    } catch (error: any) {
      console.error("Failed to sync movies:", error);
      toast({
        title: "Sync failed",
        description: error?.message || "Unable to sync right now.",
        variant: "error",
      });
    } finally {
      setSyncingMovies(false);
    }
  };

  const updateUserRole = async (target: AdminUser, endpoint: "promote" | "demote") => {
    await runAction(`${endpoint}:${target.id}`, async () => {
      const res = await fetch(`/api/admin/users/${target.id}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${endpoint} user`);
      }
      toast({
        title: endpoint === "promote" ? "User promoted" : "User demoted",
        description: `${target.username} updated successfully.`,
      });
    });
  };

  const revokeSessions = async (target: AdminUser) => {
    await runAction(`revoke:${target.id}`, async () => {
      const res = await fetch(`/api/admin/users/${target.id}/revoke-sessions`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to revoke sessions");
      }

      toast({
        title: "Sessions revoked",
        description: `${data?.data?.revokedSessions ?? 0} session(s) were revoked.`,
      });
    });
  };

  const toggleUserStatus = async (target: AdminUser, disabled: boolean) => {
    await runAction(`${disabled ? "disable" : "enable"}:${target.id}`, async () => {
      const res = await fetch(`/api/admin/users/${target.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update status");
      }

      toast({
        title: disabled ? "User disabled" : "User enabled",
        description: `${target.username} has been ${disabled ? "disabled" : "enabled"}.`,
      });
    });
  };

  const submitResetPassword = async () => {
    if (!resetTarget) return;
    await runAction(`reset:${resetTarget.id}`, async () => {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to reset password");
      }

      toast({
        title: "Password reset",
        description: `${resetTarget.username}'s password was updated.`,
      });
      setResetTarget(null);
      setNewPassword("PASSWORD123");
    });
  };

  const submitDeleteUser = async () => {
    if (!deleteTarget) return;
    await runAction(`delete:${deleteTarget.id}`, async () => {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete user");
      }

      toast({
        title: "User deleted",
        description: `${deleteTarget.username} has been soft-deleted.`,
      });
      setDeleteTarget(null);
      setAdminPassword("");
    });
  };

  const confirmTitle = useMemo(() => {
    if (!confirmIntent) return "";
    switch (confirmIntent.type) {
      case "demote":
        return `Demote ${confirmIntent.user.username}?`;
      case "revoke":
        return `Revoke sessions for ${confirmIntent.user.username}?`;
      case "disable":
        return `Disable ${confirmIntent.user.username}?`;
      case "enable":
        return `Enable ${confirmIntent.user.username}?`;
      default:
        return "Confirm action";
    }
  }, [confirmIntent]);

  const confirmDescription = useMemo(() => {
    if (!confirmIntent) return "";
    switch (confirmIntent.type) {
      case "demote":
        return "This will remove elevated privileges and set role to base user.";
      case "revoke":
        return "This will sign the user out from all active devices.";
      case "disable":
        return "Disabled users cannot log in until they are re-enabled.";
      case "enable":
        return "This user will be able to log in again.";
      default:
        return "";
    }
  }, [confirmIntent]);

  const submitConfirmIntent = async () => {
    if (!confirmIntent) return;
    const { type, user: target } = confirmIntent;
    setConfirmIntent(null);

    try {
      if (type === "demote") {
        await updateUserRole(target, "demote");
      } else if (type === "revoke") {
        await revokeSessions(target);
      } else if (type === "disable") {
        await toggleUserStatus(target, true);
      } else if (type === "enable") {
        await toggleUserStatus(target, false);
      }
    } catch (error: any) {
      console.error("Admin action failed:", error);
      toast({
        title: "Action failed",
        description: error?.message || "Please try again.",
        variant: "error",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
            <Shield className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Operational controls, users, and audit trail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Users" value={stats.totalUsers} />
        <StatCard icon={Shield} label="Admins" value={stats.totalAdmins} />
        <StatCard icon={Shield} label="Super Admins" value={stats.totalSuperAdmins} />
        <StatCard icon={UserX} label="Disabled" value={stats.disabledUsers} />
        <StatCard icon={Film} label="Movies" value={stats.totalMovies} />
        <StatCard icon={Calendar} label="Events" value={stats.totalEvents} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Data Management</h2>
          <Button
            onClick={handleSyncMovies}
            disabled={syncingMovies}
            className="inline-flex items-center gap-2"
          >
            <RotateCw className={`h-4 w-4 ${syncingMovies ? "animate-spin" : ""}`} />
            {syncingMovies ? "Syncing..." : "Sync Movies & Releases"}
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Refreshes release data and background recommendation sources.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Queue Health</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Push jobs queued</span>
              <span className="font-medium">{stats.queuedPushJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Push jobs failed</span>
              <span className="font-medium">{stats.failedPushJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suggestions total</span>
              <span className="font-medium">{stats.totalSuggestions}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-2 py-3 font-semibold sm:px-4">Username</th>
                <th className="hidden px-2 py-3 font-semibold sm:table-cell sm:px-4">Email</th>
                <th className="hidden px-2 py-3 font-semibold md:table-cell sm:px-4">Name</th>
                <th className="px-2 py-3 font-semibold sm:px-4">Role</th>
                <th className="hidden px-2 py-3 font-semibold lg:table-cell sm:px-4">Status</th>
                <th className="px-2 py-3 font-semibold sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrentUser =
                  user?.username?.toLowerCase() === u.username.toLowerCase();

                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/60 align-top hover:bg-background/50"
                  >
                    <td className="px-2 py-3 sm:px-4">
                      <p className="font-medium">{u.username}</p>
                      {isCurrentUser && (
                        <p className="text-xs text-muted-foreground">You</p>
                      )}
                    </td>
                    <td className="hidden px-2 py-3 text-muted-foreground sm:table-cell sm:px-4">
                      {u.email}
                    </td>
                    <td className="hidden px-2 py-3 text-muted-foreground md:table-cell sm:px-4">
                      {u.name || "-"}
                    </td>
                    <td className="px-2 py-3 sm:px-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          u.role === "super_admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : u.role === "admin"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="hidden px-2 py-3 text-muted-foreground lg:table-cell sm:px-4">
                      {u.deletedAt
                        ? "deleted"
                        : u.disabledAt
                          ? "disabled"
                          : "active"}
                    </td>
                    <td className="px-2 py-3 sm:px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {u.role === "user" && !u.deletedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busyAction}
                            onClick={() => updateUserRole(u, "promote")}
                          >
                            {busyAction === `promote:${u.id}` ? "..." : "Promote"}
                          </Button>
                        )}

                        {u.role !== "user" && !isCurrentUser && !u.deletedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busyAction}
                            onClick={() => setConfirmIntent({ type: "demote", user: u })}
                          >
                            <UserMinus className="mr-1 h-3.5 w-3.5" />
                            Demote
                          </Button>
                        )}

                        {!u.deletedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busyAction}
                            onClick={() => setResetTarget(u)}
                          >
                            <Lock className="mr-1 h-3.5 w-3.5" />
                            Reset
                          </Button>
                        )}

                        {!isCurrentUser && !u.deletedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busyAction}
                            onClick={() => setConfirmIntent({ type: "revoke", user: u })}
                          >
                            <UserX className="mr-1 h-3.5 w-3.5" />
                            Revoke
                          </Button>
                        )}

                        {!isCurrentUser && !u.deletedAt && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busyAction}
                            onClick={() =>
                              setConfirmIntent({
                                type: u.disabledAt ? "enable" : "disable",
                                user: u,
                              })
                            }
                          >
                            {u.disabledAt ? (
                              <>
                                <UserCheck className="mr-1 h-3.5 w-3.5" />
                                Enable
                              </>
                            ) : (
                              <>
                                <UserX className="mr-1 h-3.5 w-3.5" />
                                Disable
                              </>
                            )}
                          </Button>
                        )}

                        {!isCurrentUser && !u.deletedAt && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!!busyAction}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <Clock3 className="h-5 w-5 text-primary" />
          Admin Audit Log
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm"
              >
                <p className="font-medium">
                  {log.actor?.name || log.actor?.username || "Unknown actor"} - {log.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: {log.targetUser?.name || log.targetUser?.username || "-"} |{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetTarget?.username}. Replace the default test value before submit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="text"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="PASSWORD123"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={submitResetPassword}
              disabled={!!busyAction || newPassword.trim().length < 8}
            >
              {busyAction?.startsWith("reset:") ? "Saving..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This performs a soft delete and immediately revokes active sessions.
              Enter your own admin password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Password</label>
            <Input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Your current admin password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitDeleteUser}
              disabled={!!busyAction || adminPassword.trim().length === 0}
            >
              {busyAction?.startsWith("delete:") ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmIntent}
        onOpenChange={(open) => !open && setConfirmIntent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitConfirmIntent}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
