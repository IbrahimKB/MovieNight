"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface SuggestionAccuracyProps {
  userId?: string; // Optional, defaults to current user
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
  const { user } = useAuth();
  const [data, setData] = useState<AccuracyData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/stats", { credentials: "include" });
        const json = await res.json();
        if (json.success) {
          // If userId is provided, find in squadStats, else use userStats
          // Currently /api/stats returns detailed userStats for current user
          // and basic squadStats for everyone.
          // Basic squadStats doesn't have accepted/rejected counts explicitly in the current API response structure
          // (it has acceptanceRate).

          if (userId && userId !== user.id) {
            const squadStat = json.squadStats.find((s: any) => s.id === userId);
            if (squadStat) {
              setData({
                accuracy: squadStat.acceptanceRate,
                totalSuggestions: squadStat.suggestions,
                accepted: Math.round(
                  squadStat.suggestions * (squadStat.acceptanceRate / 100),
                ),
                rejected:
                  squadStat.suggestions -
                  Math.round(
                    squadStat.suggestions * (squadStat.acceptanceRate / 100),
                  ),
              });
            }
          } else {
            // Current user
            const u = json.userStats;
            setData({
              accuracy: u.acceptanceRate,
              totalSuggestions: u.suggestions,
              // Calculate raw numbers from rate if not provided?
              // The API calculates rate.
              // For now let's approximate or update API.
              // Let's just use rate.
              accepted: Math.round(u.suggestions * (u.acceptanceRate / 100)),
              rejected:
                u.suggestions -
                Math.round(u.suggestions * (u.acceptanceRate / 100)),
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch accuracy", error);
      }
    };

    fetchStats();
  }, [user, userId]);

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
  const { user } = useAuth();
  const [board, setBoard] = useState<{ username: string; accuracy: number }[]>(
    [],
  );

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/stats", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setBoard(
            data.squadStats
              .map((s: any) => ({
                username: s.name,
                accuracy: s.acceptanceRate,
              }))
              .sort((a: any, b: any) => b.accuracy - a.accuracy)
              .slice(0, 5),
          );
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      }
    };

    fetchLeaderboard();
  }, [user]);

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
