"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SmartNudgeProps {
  onWatchTonight?: (movieTitle: string) => void;
  onDismiss?: (nudgeId: string) => void;
}

export default function SmartNudge({
  onWatchTonight,
  onDismiss,
}: SmartNudgeProps) {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<{
    id: string;
    movie: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    const fetchNudge = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("movienight_token");
        const headers = { Authorization: token ? `Bearer ${token}` : "" };
        const res = await fetch("/api/nudge", { headers });
        const data = await res.json();
        if (data.success && data.nudge) {
          setNudge(data.nudge);
        }
      } catch (error) {
        console.error("Failed to fetch nudge", error);
      }
    };

    fetchNudge();
  }, [user]);

  if (!nudge) return null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Smart Nudge 🎯</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <strong>{nudge.movie}</strong> — {nudge.reason}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={() => onWatchTonight?.(nudge.movie)}
            className="flex-1"
          >
            Watch Tonight
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              onDismiss?.(nudge.id);
              setNudge(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
