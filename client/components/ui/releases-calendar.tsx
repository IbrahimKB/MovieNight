import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { PlatformLogo, PlatformBadges } from "./platform-logo";
import {
  Calendar,
  Film,
  Tv,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Release {
  id: string;
  title: string;
  platform: string;
  releaseDate: string;
  genres: string[];
  description?: string;
  year: number;
  poster?: string | null;
}

interface ReleasesCalendarProps {
  releases: Release[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export default function ReleasesCalendar({
  releases,
  isLoading = false,
  onRefresh,
  className,
}: ReleasesCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "timeline">("timeline");

  // Group releases by date
  const releasesByDate = useMemo(() => {
    const grouped: Record<string, Release[]> = {};

    releases.forEach((release) => {
      const dateKey = release.releaseDate.split("T")[0]; // Get YYYY-MM-DD
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(release);
    });

    return grouped;
  }, [releases]);

  // Get releases for current month (calendar view)
  const monthlyReleases = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    return releases.filter((release) => {
      const releaseDate = new Date(release.releaseDate);
      return releaseDate >= startOfMonth && releaseDate <= endOfMonth;
    });
  }, [releases, currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Loading Releases...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Releases
            <Badge variant="secondary" className="ml-2">
              {releases.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === "timeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className="h-8 px-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="h-8 px-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsContent value="timeline" className="mt-0">
            <div className="space-y-4">
              {Object.entries(releasesByDate)
                .sort(
                  ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
                )
                .map(([date, dateReleases]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <h3 className="font-semibold text-lg">
                        {formatDate(date)}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {dateReleases.length} release
                        {dateReleases.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {dateReleases.map((release) => (
                        <Card
                          key={release.id}
                          className="hover:bg-accent/50 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                {release.poster ? (
                                  <img
                                    src={release.poster}
                                    alt={release.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    {release.title
                                      .toLowerCase()
                                      .includes("season") ? (
                                      <Tv className="h-6 w-6" />
                                    ) : (
                                      <Film className="h-6 w-6" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm leading-tight">
                                  {release.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <PlatformBadges
                                    platforms={release.platform.split(", ")}
                                    size="sm"
                                  />
                                  <Badge variant="outline" className="text-xs">
                                    {release.year}
                                  </Badge>
                                </div>
                                {release.description && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {release.description}
                                  </p>
                                )}
                                {release.genres.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {release.genres.slice(0, 3).map((genre) => (
                                      <Badge
                                        key={genre}
                                        variant="secondary"
                                        className="text-xs py-0 px-1.5"
                                      >
                                        {genre}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              {Object.keys(releasesByDate).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming releases found</p>
                  <p className="text-xs mt-1">
                    Try refreshing or check back later
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {formatMonthYear(currentDate)}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div key={day} className="p-2">
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dateString = getDateString(day);
                  const dayReleases = releasesByDate[dateString] || [];
                  const isCurrentMonth =
                    day.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[80px] p-1 border rounded",
                        isCurrentMonth ? "bg-background" : "bg-muted/50",
                        isToday(day) && "bg-primary/10 border-primary",
                        dayReleases.length > 0 && "border-accent-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-medium mb-1",
                          !isCurrentMonth && "text-muted-foreground",
                          isToday(day) && "text-primary font-bold",
                        )}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayReleases.slice(0, 2).map((release) => (
                          <div
                            key={release.id}
                            className="text-xs p-1 bg-accent rounded truncate"
                            title={release.title}
                          >
                            {release.title}
                          </div>
                        ))}
                        {dayReleases.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayReleases.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calendar Summary */}
              {monthlyReleases.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">
                    This Month: {monthlyReleases.length} releases
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {monthlyReleases.slice(0, 5).map((release) => (
                      <Badge
                        key={release.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {release.title}
                      </Badge>
                    ))}
                    {monthlyReleases.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{monthlyReleases.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
