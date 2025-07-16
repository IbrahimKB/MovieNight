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
import { Bell, Check, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Notification,
  MOCK_NOTIFICATIONS,
  getNotificationIcon,
  formatTimeAgo,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationActionText,
  sortNotificationsByDate,
} from "@/lib/notificationData";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Filter notifications for the current user
  const userNotifications = sortNotificationsByDate(
    notifications.filter((n) => {
      // Include all notifications for demo, but in real app would filter by user
      return true;
    }),
  );

  const unreadCount = getUnreadCount(userNotifications);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // Delay marking as read to allow user to see the notifications
      const timer = setTimeout(() => {
        setNotifications((prev) => markAllNotificationsAsRead(prev));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) => markNotificationAsRead(prev, notification.id));

    // Handle navigation based on type
    switch (notification.type) {
      case "friend_request":
        navigate("/friends");
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
  };

  const handlePrimaryAction = (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();

    switch (notification.type) {
      case "friend_request":
        toast({
          title: "Friend request accepted! 👥",
          description: `You're now friends with ${notification.actionData?.username}`,
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

    // Remove notification after action
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setIsOpen(false);
  };

  const handleSecondaryAction = (
    e: React.MouseEvent,
    notification: Notification,
  ) => {
    e.stopPropagation();

    switch (notification.type) {
      case "friend_request":
        // Remove friend request notification when ignored
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
        toast({
          title: "Friend request ignored",
          description: `Request from ${notification.actionData?.username} was declined`,
        });
        break;
      case "suggestion":
        // Mark suggestion as read when dismissed
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        toast({
          title: "Suggestion dismissed",
          description: "You can view it later in your suggestions",
        });
        break;
      case "reminder":
        // Remove reminder when dismissed
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
        toast({
          title: "Reminder dismissed",
          description: "We won't remind you about this again",
        });
        break;
      default:
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n,
          ),
        );
        toast({
          title: "Notification dismissed",
          description: "You can always view it later",
        });
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => markAllNotificationsAsRead(prev));
    toast({
      title: "All notifications marked as read",
    });
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
              {userNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {userNotifications.map((notification) => {
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
                                {formatTimeAgo(notification.created_at)}
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
                                  >
                                    <Check className="h-3 w-3 mr-1" />
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
            {userNotifications.length > 0 && (
              <div className="border-t border-border/50 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setIsOpen(false);
                    // In a real app, this would navigate to a full notifications page
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
