import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, X, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Notification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  deleteNotification,
  respondToFriendRequest,
} from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return "👥";
    case "suggestion":
      return "🎬";
    case "movie_night":
      return "🍿";
    case "reminder":
      return "⏰";
    default:
      return "🔔";
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationActionText(notification: Notification) {
  switch (notification.type) {
    case "friend_request":
      return { primary: "Accept", secondary: "Ignore" };
    case "suggestion":
      return { primary: "View", secondary: "Dismiss" };
    case "movie_night":
      return { primary: "Join", secondary: "Maybe Later" };
    case "reminder":
      return { primary: "Watch Now", secondary: "Dismiss" };
    default:
      return { primary: null, secondary: "Dismiss" };
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  // Load notifications and unread count
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [user.id]);

  const loadNotifications = async () => {
    try {
      const userNotifications = await getNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  // Mark notifications as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(async () => {
        try {
          // Mark unread notifications as read
          const unreadNotifications = notifications.filter((n) => !n.read);
          for (const notification of unreadNotifications) {
            await markNotificationAsRead(user.id, notification.id);
          }
          // Refresh data
          await loadNotifications();
          await loadUnreadCount();
        } catch (error) {
          console.error("Failed to mark notifications as read:", error);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, notifications, user.id]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already
      if (!notification.read) {
        await markNotificationAsRead(user.id, notification.id);
      }

      // Handle navigation based on type
      switch (notification.type) {
        case "friend_request":
          navigate("/squad");
          break;
        case "suggestion":
          navigate("/suggest");
          break;
        case "movie_night":
          navigate("/movie-night");
          break;
        case "reminder":
          navigate("/watchlist");
          break;
        default:
          break;
      }

      setIsOpen(false);

      // Refresh data
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  const handlePrimaryAction = async (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      switch (notification.type) {
        case "friend_request":
          await respondToFriendRequest(
            user.id,
            notification.actionData?.friendshipId,
            "accept",
          );
          toast({
            title: "Friend request accepted! 👥",
            description: `You're now friends with ${notification.actionData?.userId}`,
          });
          break;
        case "suggestion":
          navigate("/suggest");
          break;
        case "reminder":
          toast({
            title: "Added to tonight's queue! 🎬",
            description: `${notification.actionData?.movieTitle} is ready for movie night`,
          });
          break;
        case "movie_night":
          navigate("/movie-night");
          break;
      }

      // Remove notification after action for friend requests
      if (notification.type === "friend_request") {
        await deleteNotification(user.id, notification.id);
      }

      // Refresh data
      await loadNotifications();
      await loadUnreadCount();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to handle primary action:", error);
      toast({
        title: "Error",
        description: "Failed to process action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondaryAction = async (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      switch (notification.type) {
        case "friend_request":
          await respondToFriendRequest(
            user.id,
            notification.actionData?.friendshipId,
            "reject",
          );
          await deleteNotification(user.id, notification.id);
          toast({
            title: "Friend request ignored",
            description: "Request has been declined",
          });
          break;
        case "suggestion":
          await markNotificationAsRead(user.id, notification.id);
          toast({
            title: "Suggestion dismissed",
            description: "You can view it later in your suggestions",
          });
          break;
        case "reminder":
          await deleteNotification(user.id, notification.id);
          toast({
            title: "Reminder dismissed",
            description: "We won't remind you about this again",
          });
          break;
        default:
          await markNotificationAsRead(user.id, notification.id);
          toast({
            title: "Notification dismissed",
            description: "You can always view it later",
          });
      }

      // Refresh data
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error("Failed to handle secondary action:", error);
      toast({
        title: "Error",
        description: "Failed to process action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(user.id, notification.id);
      }

      await loadNotifications();
      await loadUnreadCount();

      toast({
        title: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 p-0 hover:bg-accent/50"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 bg-[#1a1a1a] border-border/50"
        sideOffset={8}
      >
        <Card className="border-0 bg-transparent shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">🔔 Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => {
                    const actions = getNotificationActionText(notification);
                    const isUnread = !notification.read;

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-accent/20 cursor-pointer transition-colors border-l-2",
                          isUnread
                            ? "border-l-primary bg-primary/5"
                            : "border-l-transparent",
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Icon */}
                        <div className="text-lg shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="space-y-1">
                            <p
                              className={cn(
                                "text-sm leading-tight",
                                isUnread
                                  ? "font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                              {notification.content}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {isUnread && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1.5 py-0.5 h-4 bg-primary/20 text-primary"
                                >
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {(actions.primary || actions.secondary) &&
                            isUnread && (
                              <div className="flex gap-2">
                                {actions.primary && (
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) =>
                                      handlePrimaryAction(e, notification)
                                    }
                                    disabled={isLoading}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Check className="h-3 w-3 mr-1" />
                                    )}
                                    {actions.primary}
                                  </Button>
                                )}
                                {actions.secondary && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) =>
                                      handleSecondaryAction(e, notification)
                                    }
                                    disabled={isLoading}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    {actions.secondary}
                                  </Button>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border/50 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsOpen(false);
                    // Future: navigate to full notifications page
                    toast({
                      title: "All notifications",
                      description: "This would open a full notifications page",
                    });
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
