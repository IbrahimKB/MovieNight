"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Plus, Clock, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  movieTitle: string;
  moviePoster?: string;
  date: string;
  time: string;
  participants: string[];
  participantCount: number;
  notes?: string;
  createdBy: string;
}

export default function EventsPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("movienight_token");
        const res = await fetch("/api/events", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        setEvents(data.data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [mounted, user]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Movie Nights</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Plan and organize movie nights with friends
          </p>
        </div>

        {/* Create Event Button */}
        <div className="mb-8">
          <button className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold flex items-center gap-2 text-sm md:text-base">
            <Plus size={18} />
            Create Movie Night
          </button>
        </div>

        {/* Events Grid */}
        {events.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                  {/* Poster */}
                  <div className="md:col-span-1 h-48 md:h-64 bg-secondary overflow-hidden">
                    {event.moviePoster ? (
                      <img
                        src={event.moviePoster}
                        alt={event.movieTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={60} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="md:col-span-2 p-4 md:p-8 flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        {event.movieTitle}
                      </h2>

                      {/* Date and Time */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm md:text-base">
                          <Calendar
                            size={18}
                            className="text-primary flex-shrink-0"
                          />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm md:text-base">
                          <Clock
                            size={18}
                            className="text-primary flex-shrink-0"
                          />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm md:text-base">
                          <Users
                            size={18}
                            className="text-primary flex-shrink-0"
                          />
                          <span>{event.participantCount} people attending</span>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="mb-6">
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">
                          Participants
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.participants.map((participant) => (
                            <div
                              key={participant}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs md:text-sm"
                            >
                              {participant}
                            </div>
                          ))}
                          {event.participantCount > event.participants.length && (
                            <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs md:text-sm">
                              +{event.participantCount - event.participants.length}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {event.notes && (
                        <div className="mb-6">
                          <p className="text-xs md:text-sm text-muted-foreground mb-2">
                            Notes
                          </p>
                          <p className="text-sm md:text-base italic">
                            "{event.notes}"
                          </p>
                        </div>
                      )}

                      {/* Organizer */}
                      <div className="text-xs md:text-sm text-muted-foreground">
                        Created by{" "}
                        <span className="text-foreground font-medium">
                          {event.createdBy}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-6 border-t border-border">
                      {event.createdBy === "You" ? (
                        <>
                          <button className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base">
                            <Edit2 size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button className="flex-1 px-4 py-2 rounded-lg border border-border text-destructive hover:bg-destructive/10 transition-colors font-medium flex items-center justify-center gap-2 text-sm md:text-base">
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold text-sm md:text-base">
                            Join
                          </button>
                          <button className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors font-medium text-sm md:text-base">
                            Maybe
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar size={48} className="text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No movie nights planned</h2>
            <p className="text-muted-foreground mb-6">
              Create one to get started!
            </p>
            <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold inline-flex items-center gap-2">
              <Plus size={18} />
              Create Movie Night
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
