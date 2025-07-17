import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Send, Users, TestTube } from "lucide-react";
import { toast } from "sonner";
import { NOTIFICATION_META, NotificationType } from "@/lib/notifications";

export default function AdminPushDemo() {
  const [selectedType, setSelectedType] =
    useState<NotificationType>("movie_suggestion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetUserIds, setTargetUserIds] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter both title and body");
      return;
    }

    try {
      setIsSending(true);

      const userIds = targetUserIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

      if (userIds.length === 0) {
        toast.error("Please enter at least one user ID");
        return;
      }

      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({
          userIds,
          type: selectedType,
          title,
          body,
          data: {
            test: true,
            timestamp: Date.now(),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Notification sent! ${result.results?.sent || 0} delivered, ${result.results?.failed || 0} failed`,
        );

        // Clear form
        setTitle("");
        setBody("");
        setTargetUserIds("");
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("movienight_token")}`,
        },
        body: JSON.stringify({ type: selectedType }),
      });

      if (response.ok) {
        toast.success("Test notification sent to yourself!");
      } else {
        throw new Error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Failed to send test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  const populateExample = () => {
    const meta = NOTIFICATION_META[selectedType];
    setTitle(`${meta.icon} ${meta.title}`);
    setBody(
      `This is a test notification for ${meta.description.toLowerCase()}`,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            This is a demo tool for testing push notifications. In production,
            notifications would be sent automatically based on user actions.
          </AlertDescription>
        </Alert>

        {/* Notification Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Notification Type</Label>
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(value as NotificationType)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NOTIFICATION_META).map(([type, meta]) => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span>{meta.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {meta.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={populateExample}
            className="flex-1"
          >
            <TestTube className="h-3 w-3 mr-1" />
            Fill Example
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestNotification}
            className="flex-1"
          >
            <Bell className="h-3 w-3 mr-1" />
            Test to Self
          </Button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Notification Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title..."
            maxLength={100}
          />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Label htmlFor="body">Notification Body</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message..."
            rows={3}
            maxLength={300}
          />
        </div>

        {/* Target Users */}
        <div className="space-y-2">
          <Label htmlFor="users">Target User IDs</Label>
          <Input
            id="users"
            value={targetUserIds}
            onChange={(e) => setTargetUserIds(e.target.value)}
            placeholder="Enter user IDs separated by commas..."
          />
          <p className="text-xs text-muted-foreground">
            Example: user-1, user-2, user-3
          </p>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendNotification}
          disabled={isSending || !title.trim() || !body.trim()}
          className="w-full"
        >
          {isSending ? (
            "Sending..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Push Notification
            </>
          )}
        </Button>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            • Notifications will only be sent to users with active push
            subscriptions
          </p>
          <p>• Users can customize which notification types they receive</p>
          <p>• Failed deliveries are tracked for cleanup</p>
        </div>
      </CardContent>
    </Card>
  );
}
