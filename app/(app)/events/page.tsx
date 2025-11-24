"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus } from "lucide-react";

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
  participants?: string[];
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("movienight_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events", { headers });
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          // Sort by date
          const sorted = data.data.sort(
            (a: Event, b: Event) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setEvents(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [token]);

  const EventCard = ({ event }: { event: Event }) => {
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate > new Date();

    return (
      <button
        onClick={() => router.push(`/events/${event.id}`)}
        className="flex gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all text-left"
      >
        {/* Date Bubble */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            {eventDate.toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className="text-lg font-bold text-primary">
            {eventDate.getDate()}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{event.movie?.title}</h3>
          <p className="text-sm text-muted-foreground">
            Hosted by {event.hostUser?.name || event.hostUser?.username}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {eventDate.toLocaleDateString("en-US", {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {event.participants && event.participants.length > 0 && (
            <p className="text-xs text-primary mt-2 font-medium">
              {event.participants.length} people attending
            </p>
          )}
        </div>

        {/* Poster */}
        {event.movie?.poster && (
          <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden">
            <img
              src={event.movie.poster}
              alt={event.movie.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  const upcomingEvents = events.filter((e) => new Date(e.date) > new Date());
  const pastEvents = events.filter((e) => new Date(e.date) <= new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Movie Events</h1>
          <p className="text-muted-foreground">
            Plan movie nights with friends
          </p>
        </div>
        <button
          onClick={() => router.push("/events/create")}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Create Event
        </button>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming</h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Past Events</h2>
          <div className="space-y-2">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">No events yet</p>
          <button
            onClick={() => router.push("/events/create")}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Create First Event
          </button>
        </div>
      )}
    </div>
  );
}
