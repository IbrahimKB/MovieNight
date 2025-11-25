'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Target,
  Film,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  Crown,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsEntry {
  rank: number;
  name: string;
  totalWatched: number;
  suggestions: number;
  avgRating: number;
  avgDesire: number;
}

// Mock data
const mockUserStats = {
  totalMoviesWatched: 24,
  totalSuggestionsMade: 18,
  acceptanceRate: 72,
  avgWatchDesireScore: 7.8,
  favGenre: 'Thriller',
};

const mockSquadStats: StatsEntry[] = [
  {
    rank: 1,
    name: 'Ibrahim',
    totalWatched: 24,
    suggestions: 18,
    avgRating: 8.2,
    avgDesire: 7.8,
  },
  {
    rank: 2,
    name: 'Omar',
    totalWatched: 22,
    suggestions: 16,
    avgRating: 8.0,
    avgDesire: 7.5,
  },
  {
    rank: 3,
    name: 'Sara',
    totalWatched: 20,
    suggestions: 15,
    avgRating: 7.9,
    avgDesire: 7.3,
  },
  {
    rank: 4,
    name: 'Alex',
    totalWatched: 18,
    suggestions: 12,
    avgRating: 7.6,
    avgDesire: 7.0,
  },
  {
    rank: 5,
    name: 'Maya',
    totalWatched: 16,
    suggestions: 10,
    avgRating: 7.4,
    avgDesire: 6.8,
  },
];

export default function StatsPage() {
  const [viewMode] = useState<'individual' | 'group'>('group');

  const getStatsCardColor = (value: number) => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 7) return 'bg-blue-500';
    if (value >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">🏆 ReelTalk</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your squad's movie-watching stats & wins
        </p>
      </div>

      {/* Your Stats */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            📊 Your Stats
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Squad Rank: 1st 👑</Badge>
            <Badge className="bg-yellow-500 text-white text-xs">
              👑 Movie Maestro
            </Badge>
            <Badge className="bg-blue-500 text-white text-xs">
              🎬 Suggestion King
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Movies Watched */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-purple-500">
                    <Film className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {mockUserStats.totalMoviesWatched}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🎬 Movies Watched
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Suggestions Made */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-green-500">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {mockUserStats.totalSuggestionsMade}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🎯 Suggestions Made
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acceptance Rate */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white bg-blue-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {mockUserStats.acceptanceRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ✅ Acceptance Rate
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Watch Desire Score */}
            <Card className="border-0 bg-accent/30">
              <CardContent className="p-4 text-center">
                <div className="space-y-2">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white',
                      getStatsCardColor(mockUserStats.avgWatchDesireScore)
                    )}
                  >
                    <Star className="h-6 w-6" />
                  </div>
                  <div className="text-2xl font-bold">
                    {mockUserStats.avgWatchDesireScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    🔥 Avg Desire Score
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Favorite Genre
                </p>
                <p className="text-lg font-semibold">
                  {mockUserStats.favGenre}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Movies this month
                </p>
                <p className="text-lg font-semibold">7 new</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Individual vs Group */}
      <Tabs defaultValue="group" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Stats</TabsTrigger>
          <TabsTrigger value="group">Squad Leaderboard</TabsTrigger>
        </TabsList>

        {/* Individual Stats Tab */}
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['January', 'December', 'November'].map((month, i) => (
                  <div key={month} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{month}</div>
                    <div className="flex-1 h-8 bg-accent rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-lg"
                        style={{ width: `${(i + 1) * 30}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-medium">
                      {(i + 1) * 8} movies
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Squad Leaderboard Tab */}
        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Squad Rankings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Overall stats for your entire squad
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSquadStats.map((entry) => (
                  <div
                    key={entry.rank}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                      entry.rank === 1
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                        : 'bg-accent/30'
                    )}
                  >
                    {/* Rank */}
                    <div className="text-2xl font-bold w-12 text-center">
                      {getMedalIcon(entry.rank)}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.suggestions} suggestions
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="text-sm font-semibold">
                          {entry.totalWatched}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Watched
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-white',
                            getStatsCardColor(entry.avgRating)
                          )}
                        >
                          {entry.avgRating}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            🏅 Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: '👑', name: 'Movie Maestro', desc: 'Most suggestions' },
              { icon: '🎯', name: 'Accurate', desc: '70%+ acceptance' },
              {
                icon: '🎭',
                name: 'Genre Master',
                desc: 'Expert in Thriller',
              },
              { icon: '🔥', name: 'Hot Take', desc: 'Highest avg rating' },
              {
                icon: '👀',
                name: 'Film Fanatic',
                desc: '20+ movies watched',
              },
              { icon: '⭐', name: 'Rising Star', desc: 'New this month' },
            ].map((achievement, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-4 rounded-lg bg-accent/30 border border-primary/20 text-center"
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="font-semibold text-sm">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">
                  {achievement.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
