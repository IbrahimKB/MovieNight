"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  movieTitle: string;
  date: string;
  type: "event" | "watched";
  eventId?: string;
}

interface Day {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both events and watch history
      const [eventsRes, historyRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/watch/history"),
      ]);

      const eventsData = await eventsRes.json();
      const historyData = await historyRes.json();

      if (!eventsRes.ok || !historyRes.ok) {
        setError("Failed to fetch calendar data");
        return;
      }

      // Combine events and watch history into calendar structure
      const eventMap = new Map<string, CalendarEvent[]>();

      // Add movie night events
      if (eventsData.data) {
        eventsData.data.forEach((event: any) => {
          const dateKey = new Date(event.date).toISOString().split("T")[0];
          if (!eventMap.has(dateKey)) {
            eventMap.set(dateKey, []);
          }
          eventMap.get(dateKey)!.push({
            id: event.id,
            movieTitle: event.movieTitle,
            date: event.date,
            type: "event",
            eventId: event.id,
          });
        });
      }

      // Add watched movies
      if (historyData.data) {
        historyData.data.forEach((watched: any) => {
          const dateKey = new Date(watched.watchedAt)
            .toISOString()
            .split("T")[0];
          if (!eventMap.has(dateKey)) {
            eventMap.set(dateKey, []);
          }
          eventMap.get(dateKey)!.push({
            id: watched.id,
            movieTitle: watched.title,
            date: watched.watchedAt,
            type: "watched",
          });
        });
      }

      // Generate calendar days
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const calendarDays: Day[] = [];

      // Add previous month's days
      const prevMonth = new Date(year, month, 0);
      const daysInPrevMonth = prevMonth.getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, daysInPrevMonth - i);
        const dateKey = date.toISOString().split("T")[0];
        calendarDays.push({
          date,
          events: eventMap.get(dateKey) || [],
          isCurrentMonth: false,
        });
      }

      // Add current month's days
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateKey = date.toISOString().split("T")[0];
        calendarDays.push({
          date,
          events: eventMap.get(dateKey) || [],
          isCurrentMonth: true,
        });
      }

      // Add next month's days
      const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        const dateKey = date.toISOString().split("T")[0];
        calendarDays.push({
          date,
          events: eventMap.get(dateKey) || [],
          isCurrentMonth: false,
        });
      }

      setDays(calendarDays);
    } catch (err) {
      setError("An error occurred");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Calendar</h1>
        <Link
          href="/events/create"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Create Movie Night
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-8">
          Loading calendar...
        </p>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="bg-primary/10 border-b border-border px-6 py-4 flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="px-4 py-2 hover:bg-primary/20 rounded transition-colors"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-semibold">{monthName}</h2>
            <button
              onClick={goToNextMonth}
              className="px-4 py-2 hover:bg-primary/20 rounded transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-border">
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-muted text-muted-foreground font-semibold text-center py-3 border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, idx) => (
              <div
                key={idx}
                className={`min-h-32 p-2 border-r border-b border-border last:border-r-0 ${
                  day.isCurrentMonth ? "bg-background" : "bg-muted/50"
                }`}
              >
                <div
                  className={`font-semibold mb-2 ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {day.events.map((event) => (
                    <div key={event.id} className="text-xs">
                      {event.type === "event" ? (
                        <Link
                          href={`/events/${event.eventId}`}
                          className="block px-2 py-1 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors truncate"
                          title={`Movie Night: ${event.movieTitle}`}
                        >
                          🎬 {event.movieTitle}
                        </Link>
                      ) : (
                        <div
                          className="block px-2 py-1 bg-green-500/20 text-green-400 rounded truncate"
                          title={`Watched: ${event.movieTitle}`}
                        >
                          ✓ {event.movieTitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-primary/20 rounded"></div>
            <span className="text-sm">Movie Night Event</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500/20 rounded"></div>
            <span className="text-sm">Movie Watched</span>
          </div>
        </div>
      </div>
    </div>
  );
}
