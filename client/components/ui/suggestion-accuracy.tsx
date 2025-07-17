import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingUp,
  Star,
  Users,
  Eye,
  Award,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionAccuracy {
  userId: string;
  totalSuggestions: number;
  ratedSuggestions: number;
  accuracy: number;
  accuracyScore: string;
  breakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  recentSuggestions: Array<{
    movieTitle: string;
    desiredRating: number;
    actualRating: number;
    accuracy: number;
    ratingCount: number;
  }>;
}

interface SuggestionAccuracyProps {
  userId: string;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function SuggestionAccuracy({
  userId,
  compact = false,
  showDetails = false,
  className,
}: SuggestionAccuracyProps) {
  const [accuracy, setAccuracy] = useState<SuggestionAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccuracy = async () => {
      try {
        const response = await fetch(
          `/api/analytics/suggestion-accuracy/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setAccuracy(data.data);
        } else {
          setError("Failed to load accuracy data");
        }
      } catch (err) {
        setError("Error loading accuracy data");
      } finally {
        setLoading(false);
      }
    };

    fetchAccuracy();
  }, [userId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !accuracy) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error || "No accuracy data available"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return "text-green-600";
    if (acc >= 75) return "text-blue-600";
    if (acc >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyIcon = (acc: number) => {
    if (acc >= 90) return "🎯";
    if (acc >= 75) return "👍";
    if (acc >= 60) return "👌";
    return "📊";
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Target
          className={cn("h-4 w-4", getAccuracyColor(accuracy.accuracy))}
        />
        <span className="text-sm font-medium">
          {accuracy.accuracy}% accuracy
        </span>
        <Badge variant="outline" className="text-xs">
          {getAccuracyIcon(accuracy.accuracy)}{" "}
          {accuracy.accuracyScore.replace(/[🎯👍👌📊]/g, "").trim()}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Suggestion Accuracy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Accuracy Score */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            <span className={getAccuracyColor(accuracy.accuracy)}>
              {accuracy.accuracy}%
            </span>
          </div>
          <Badge variant="outline" className="text-sm">
            {accuracy.accuracyScore}
          </Badge>
          <p className="text-xs text-muted-foreground">
            Based on {accuracy.ratedSuggestions} rated suggestions
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Prediction Quality</span>
            <span>{accuracy.accuracy}%</span>
          </div>
          <Progress value={accuracy.accuracy} className="h-2" />
        </div>

        {/* Breakdown */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Accuracy Breakdown</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Excellent (90%+)
                </span>
                <span>{accuracy.breakdown.excellent}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Good (75-89%)
                </span>
                <span>{accuracy.breakdown.good}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Fair (60-74%)
                </span>
                <span>{accuracy.breakdown.fair}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Poor (&lt;60%)
                </span>
                <span>{accuracy.breakdown.poor}</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Suggestions */}
        {showDetails && accuracy.recentSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Predictions</h4>
            <div className="space-y-2">
              {accuracy.recentSuggestions
                .slice(0, 3)
                .map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-accent/30 rounded text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{suggestion.movieTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Predicted: {suggestion.desiredRating}/10</span>
                        <span>•</span>
                        <span>Actual: {suggestion.actualRating}/10</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        getAccuracyColor(suggestion.accuracy),
                      )}
                    >
                      {suggestion.accuracy}%
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="flex justify-between items-center pt-2 border-t text-sm text-muted-foreground">
          <span>{accuracy.totalSuggestions} total suggestions</span>
          <span>{accuracy.ratedSuggestions} rated</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Leaderboard component for suggestion accuracy
export function SuggestionLeaderboard({ className }: { className?: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/analytics/suggestion-leaderboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          Top Predictors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.ratedSuggestions} predictions
                  </p>
                </div>
              </div>
              <Badge variant="outline">{user.accuracy}%</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
