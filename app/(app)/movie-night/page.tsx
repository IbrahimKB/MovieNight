"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function MovieNightPage() {
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
      <h1 className="text-4xl font-bold mb-8">Plan Movie Night</h1>
      <p className="text-muted-foreground">
        Organize and plan movie nights with your friends.
      </p>
    </div>
  );
}
