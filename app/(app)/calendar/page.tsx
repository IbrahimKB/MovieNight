"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Event {
  id: string;
  movieId: string;
  date: string;
  movie?: {
    title: string;
    poster?: string;
  };
  hostUser?: {
    name: string;
    username: string;
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayEvents, setDayEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("movienight_token")
      : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events", { headers, credentials: "include" });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setEvents(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [token]);

  // Update day events when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const selected = events.filter(
        (event) =>
          new Date(event.date).toDateString() ===
          new Date(selectedDate).toDateString(),
      );
      setDayEvents(selected);
    }
  }, [selectedDate, events]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    ).toDateString();
    return events.filter(
      (event) => new Date(event.date).toDateString() === dateStr,
    );
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
    setSelectedDate(null);
  };

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          Movie Calendar
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Plan and track your movie nights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold">{monthName}</h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dateEvents = day ? getEventsForDate(day) : [];
                const isSelected =
                  selectedDate &&
                  new Date(selectedDate).toDateString() ===
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day || 1,
                    ).toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (day) {
                        setSelectedDate(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            day,
                          ).toISOString(),
                        );
                      }
                    }}
                    disabled={!day}
                    className={`aspect-square rounded-lg p-2 text-sm font-medium transition-all flex flex-col items-center justify-center relative ${
                      !day
                        ? "text-muted-foreground/30"
                        : isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/50 border border-border"
                    }`}
                  >
                    {day}
                    {dateEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dateEvents.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              isSelected
                                ? "bg-primary-foreground"
                                : "bg-primary"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold mb-4">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              : "Select a Date"}
          </h3>

          {selectedDate && dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="w-full text-left p-3 rounded-lg bg-background hover:bg-background/80 transition-colors border border-border hover:border-primary/50"
                >
                  <p className="font-semibold text-sm">{event.movie?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hosted by {event.hostUser?.name || event.hostUser?.username}
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">
                    View Event
                  </p>
                </button>
              ))}
            </div>
          ) : selectedDate ? (
            <p className="text-muted-foreground text-sm">
              No events scheduled for this date
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Click on a date to view events
            </p>
          )}

          <button
            onClick={() => router.push("/events")}
            className="w-full mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            View All Events
          </button>
        </div>
      </div>
    </div>
  );
}
