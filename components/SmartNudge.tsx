"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SmartNudgeProps {
  onWatchTonight?: (movieTitle: string) => void;
  onDismiss?: (nudgeId: string) => void;
}

export default function SmartNudge({
  onWatchTonight,
  onDismiss,
}: SmartNudgeProps) {
  const [nudge, setNudge] = useState<{
    id: string;
    movie: string;
    reason: string;
  } | null>(null);

  // Fake AI nudge generator (you can connect to real API later)
  useEffect(() => {
    setNudge({
      id: "nudge-1",
      movie: "The Dark Knight",
      reason: "3 of your friends rated it 9+ recently",
    });
  }, []);

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
