"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, Users, Clapperboard, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface EventDetail {
  id: string;
  movieId: string;
  date: string;
  notes?: string;
  participants: string[];
  movie?: {
    id: string;
    title: string;
    year: number;
    poster?: string;
    description: string;
  };
  hostUser?: {
    id: string;
    name: string | null;
    username: string;
  };
}

interface InvitationStatus {
  id: string;
  status: "pending" | "accepted" | "declined";
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [invitationStatus, setInvitationStatus] =
    useState<InvitationStatus | null>(null);
  const [respondingToInvitation, setRespondingToInvitation] = useState(false);
  const [guests, setGuests] = useState<any[]>([]);

  const fetchEventData = async () => {
    try {
      const [eventRes, inviteRes] = await Promise.all([
        fetch(`/api/events/${eventId}`, {
          credentials: "include",
        }),
        fetch(`/api/events/${eventId}/invite`, {
          credentials: "include",
        }).catch(() => null), // Invitation endpoint might 404 if not invited
      ]);

      const eventData = await eventRes.json();
      if (eventData.success && eventData.data) {
        setEvent(eventData.data);
        setIsAttending(
          eventData.data.participants?.length > 0 ?? false,
        );
      }

      if (inviteRes && inviteRes.ok) {
        const inviteData = await inviteRes.json();
        if (inviteData.success && inviteData.data) {
          // Find the current user's invitation
          const currentInvitation = inviteData.data[0];
          if (currentInvitation) {
            setInvitationStatus(currentInvitation);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch event data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const handleRespondToInvitation = async (
    status: "accepted" | "declined"
  ) => {
    try {
      setRespondingToInvitation(true);
      const res = await fetch(`/api/events/${eventId}/invite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(
          status === "accepted"
            ? "You accepted the invitation!"
            : "You declined the invitation"
        );
        setInvitationStatus((prev) =>
          prev ? { ...prev, status } : null
        );
        if (status === "accepted") {
          setIsAttending(true);
        }
        await fetchEventData();
      } else {
        toast.error("Failed to respond to invitation");
      }
    } catch (error) {
      console.error("Failed to respond:", error);
      toast.error("Failed to respond to invitation");
    } finally {
      setRespondingToInvitation(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Hero Section */}
      <div className="relative -mx-4 md:-mx-0">
        <div className="relative aspect-video bg-card border border-border rounded-xl overflow-hidden flex items-center justify-center">
          {event.movie?.poster ? (
            <img
              src={event.movie.poster}
              alt={event.movie.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Clapperboard className="h-16 w-16 text-muted-foreground mx-auto" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Poster Card */}
        <div className="absolute bottom-0 left-0 md:left-8 md:bottom-8 -mb-20 md:mb-0">
          <div className="w-32 h-48 bg-card border border-border rounded-lg overflow-hidden shadow-2xl">
            {event.movie?.poster ? (
              <img
                src={event.movie.poster}
                alt={event.movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Clapperboard className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-28 md:pt-0">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
          {event.movie?.title}
        </h1>

        {/* Event Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Date & Time</p>
            </div>
            <p className="text-lg font-semibold">
              {eventDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {eventDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Attendees</p>
            </div>
            <p className="text-lg font-semibold">
              {event.participants?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">people attending</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clapperboard className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Host</p>
            </div>
            <p className="text-lg font-semibold">
              {event.hostUser?.name ||
                event.hostUser?.username ||
                "Unknown Host"}
            </p>
          </div>
        </div>

        {/* RSVP/Invitation Section */}
        {invitationStatus &&
        invitationStatus.status === "pending" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl"
          >
            <p className="text-sm font-medium text-foreground mb-4">
              You've been invited to this event. Will you attend?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRespondToInvitation("declined")}
                disabled={respondingToInvitation}
                className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
              <button
                onClick={() => handleRespondToInvitation("accepted")}
                disabled={respondingToInvitation}
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
            </div>
          </motion.div>
        ) : invitationStatus &&
          invitationStatus.status === "accepted" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              You accepted this invitation
            </span>
          </motion.div>
        ) : invitationStatus &&
          invitationStatus.status === "declined" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <X className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              You declined this invitation
            </span>
          </motion.div>
        ) : isAttending ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3"
          >
            <Check className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              You're attending this event
            </span>
          </motion.div>
        ) : null}

        {/* Movie Info */}
        {event.movie && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">About the Movie</h2>
            <p className="text-foreground leading-relaxed">
              {event.movie.description}
            </p>

            <div className="grid grid-cols-2 gap-4 bg-card border border-border rounded-xl p-6">
              <div>
                <p className="text-xs text-muted-foreground">Title</p>
                <p className="font-semibold">{event.movie.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Year</p>
                <p className="font-semibold">{event.movie.year}</p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/movies/${event.movieId}`)}
              className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:border-primary/50 font-medium transition-colors"
            >
              View Full Movie Details
            </button>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div className="mt-8 p-6 bg-card border border-border rounded-xl">
            <h3 className="font-semibold mb-2">Event Notes</h3>
            <p className="text-muted-foreground">{event.notes}</p>
          </div>
        )}

        {/* Guest List */}
        {event.participants && event.participants.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Guest List</h3>
            <div className="space-y-2">
              {event.participants.slice(0, 10).map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {participant[0].toUpperCase()}
                  </div>
                  <p className="font-medium text-sm">{participant}</p>
                  {participant === event.hostUser?.username && (
                    <span className="ml-auto text-xs text-primary font-medium">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
