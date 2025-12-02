"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User, Clock, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EventInvitationCardProps {
  id: string;
  eventId: string;
  movieTitle: string;
  moviePoster?: string;
  hostName: string;
  eventDate: string;
  invitedAt: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onClose?: () => void;
}

export function EventInvitationCard({
  id,
  eventId,
  movieTitle,
  moviePoster,
  hostName,
  eventDate,
  invitedAt,
  onAccept,
  onDecline,
  onClose,
}: EventInvitationCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isResponded, setIsResponded] = useState(false);
  const [response, setResponse] = useState<"accepted" | "declined" | null>(null);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await onAccept();
      setResponse("accepted");
      setIsResponded(true);
      toast.success("Event invitation accepted!");
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsDeclining(true);
      await onDecline();
      setResponse("declined");
      setIsResponded(true);
      toast.success("Event invitation declined");
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      toast.error("Failed to decline invitation");
    } finally {
      setIsDeclining(false);
    }
  };

  const eventDateObj = new Date(eventDate);
  const invitedDateObj = new Date(invitedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{movieTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Invited by {hostName}
              </p>
            </div>
            {moviePoster && (
              <div className="w-12 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 ml-4">
                <img
                  src={moviePoster}
                  alt={movieTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {eventDateObj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Clock className="h-4 w-4 text-primary ml-2" />
              <span>
                {eventDateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Invited{" "}
                {invitedDateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isResponded ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDecline}
                disabled={isAccepting || isDeclining}
              >
                <X className="h-4 w-4 mr-2" />
                {isDeclining ? "Declining..." : "Decline"}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAccept}
                disabled={isAccepting || isDeclining}
              >
                <Check className="h-4 w-4 mr-2" />
                {isAccepting ? "Accepting..." : "Accept"}
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-lg text-center text-sm font-medium ${
                response === "accepted"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {response === "accepted" ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  You accepted this invitation
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  You declined this invitation
                </span>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EventInvitationCard;
