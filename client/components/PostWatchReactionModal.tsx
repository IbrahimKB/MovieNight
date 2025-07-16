import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Star, Sparkles, Clock, Zap, Meh, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostWatchReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reaction: PostWatchReaction) => void;
  movieTitle: string;
  originalScore?: number;
}

export interface PostWatchReaction {
  rating: number;
  tags: string[];
  oneLineReaction?: string;
}

const REACTION_TAGS = [
  {
    id: "underrated",
    label: "Underrated",
    icon: "📈",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  {
    id: "overrated",
    label: "Overrated",
    icon: "📉",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  {
    id: "meh",
    label: "Meh",
    icon: "😐",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
  {
    id: "banger",
    label: "Banger",
    icon: "💥",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  {
    id: "mindblown",
    label: "Mindblown",
    icon: "🤯",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  {
    id: "toolong",
    label: "Too Long",
    icon: "⏰",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
];

export default function PostWatchReactionModal({
  isOpen,
  onClose,
  onSave,
  movieTitle,
  originalScore,
}: PostWatchReactionModalProps) {
  const [rating, setRating] = useState<number[]>([7]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [oneLineReaction, setOneLineReaction] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const reaction: PostWatchReaction = {
      rating: rating[0],
      tags: selectedTags,
      oneLineReaction: oneLineReaction.trim() || undefined,
    };

    onSave(reaction);
    setIsLoading(false);

    // Reset form
    setRating([7]);
    setSelectedTags([]);
    setOneLineReaction("");
  };

  const handleCancel = () => {
    // Reset form
    setRating([7]);
    setSelectedTags([]);
    setOneLineReaction("");
    onClose();
  };

  const getRatingColor = (score: number) => {
    if (score >= 8.5) return "text-green-500";
    if (score >= 7) return "text-yellow-500";
    if (score >= 5) return "text-orange-500";
    return "text-red-500";
  };

  const getRatingDescription = (score: number) => {
    if (score >= 9) return "Amazing! 🔥";
    if (score >= 8) return "Really good! 😊";
    if (score >= 7) return "Pretty good 👍";
    if (score >= 6) return "Decent 👌";
    if (score >= 5) return "Okay 😐";
    if (score >= 4) return "Not great 😕";
    if (score >= 3) return "Poor 😞";
    return "Terrible 😭";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            How was it?
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your thoughts on{" "}
            <span className="font-medium">{movieTitle}</span>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Your Rating</label>
              <div className="flex items-center gap-2">
                <Star className={cn("h-4 w-4", getRatingColor(rating[0]))} />
                <span
                  className={cn("font-bold text-lg", getRatingColor(rating[0]))}
                >
                  {rating[0]}/10
                </span>
              </div>
            </div>
            <Slider
              value={rating}
              onValueChange={setRating}
              max={10}
              min={1}
              step={0.5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Terrible</span>
              <span className={cn("font-medium", getRatingColor(rating[0]))}>
                {getRatingDescription(rating[0])}
              </span>
              <span>Perfect</span>
            </div>

            {/* Score Comparison */}
            {originalScore && (
              <div className="bg-accent/30 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Expected vs Actual:
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{originalScore}</Badge>
                    <span>→</span>
                    <Badge
                      className={cn(
                        rating[0] > originalScore
                          ? "bg-green-600"
                          : rating[0] < originalScore
                            ? "bg-red-600"
                            : "bg-gray-600",
                      )}
                    >
                      {rating[0]}
                    </Badge>
                  </div>
                </div>
                {rating[0] !== originalScore && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {rating[0] > originalScore
                      ? "Better than expected! 📈"
                      : "Didn't quite hit the mark 📉"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick Tags (Optional)</label>
            <div className="grid grid-cols-2 gap-2">
              {REACTION_TAGS.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTagToggle(tag.id)}
                  className={cn(
                    "justify-start h-auto p-3 transition-all",
                    selectedTags.includes(tag.id) && tag.color,
                  )}
                >
                  <span className="mr-2">{tag.icon}</span>
                  {tag.label}
                </Button>
              ))}
            </div>
          </div>

          {/* One-liner Reaction */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Leave a 1-liner reaction... (Optional)
            </label>
            <Textarea
              placeholder="e.g., 'That ending hit different!' or 'Needed more cowbell.'"
              value={oneLineReaction}
              onChange={(e) => setOneLineReaction(e.target.value)}
              rows={2}
              maxLength={150}
            />
            <div className="text-xs text-muted-foreground text-right">
              {oneLineReaction.length}/150
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Save Reaction
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
