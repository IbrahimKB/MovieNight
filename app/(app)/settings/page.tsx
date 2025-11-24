"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Settings</h2>
        <p className="text-muted-foreground mb-4">
          Configure your account preferences and settings.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <p className="text-muted-foreground">{user.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
