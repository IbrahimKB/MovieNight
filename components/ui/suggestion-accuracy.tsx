"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SuggestionAccuracyProps {
  userId: string;
  showDetails?: boolean;
  className?: string;
}

interface AccuracyData {
  accuracy: number;
  totalSuggestions: number;
  accepted: number;
  rejected: number;
}

export default function SuggestionAccuracy({
  userId,
  showDetails = false,
  className,
}: SuggestionAccuracyProps) {
  const [data, setData] = useState<AccuracyData | null>(null);

  useEffect(() => {
    // Fake data – you can replace with real API later
    setTimeout(() => {
      setData({
        accuracy: 82,
        totalSuggestions: 17,
        accepted: 14,
        rejected: 3,
      });
    }, 500);
  }, [userId]);

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Suggestion Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading accuracy…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Suggestion Accuracy</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-center text-4xl font-bold">{data.accuracy}%</div>

        {showDetails && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total: {data.totalSuggestions}</span>
            <span>Accepted: {data.accepted}</span>
            <span>Rejected: {data.rejected}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------
   LEADERBOARD
------------------------------------------------------- */

export function SuggestionLeaderboard() {
  const [board, setBoard] = useState<
    { username: string; accuracy: number }[]
  >([]);

  useEffect(() => {
    // Fake leaderboard data
    setTimeout(() => {
      setBoard([
        { username: "Aisha", accuracy: 91 },
        { username: "Sam", accuracy: 88 },
        { username: "Nora", accuracy: 79 },
      ]);
    }, 500);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Predictors</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {board.length === 0 ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading leaderboard…
          </p>
        ) : (
          board.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
            >
              <span className="font-medium">{entry.username}</span>
              <Badge variant="outline">{entry.accuracy}%</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
