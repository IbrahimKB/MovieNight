import { cn } from "@/lib/utils";

interface PlatformLogoProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlatformLogo({
  platform,
  size = "md",
  className,
}: PlatformLogoProps) {
  const sizeClasses = {
    sm: "h-4 w-auto",
    md: "h-6 w-auto",
    lg: "h-8 w-auto",
  };

  const platformName = platform.toLowerCase().replace(/\s+/g, "");

  const getPlatformIcon = (name: string) => {
    switch (name) {
      case "netflix":
        return (
          <div
            className={cn(
              "bg-red-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            NETFLIX
          </div>
        );

      case "amazon":
      case "prime":
      case "primevideo":
      case "amazonprime":
        return (
          <div
            className={cn(
              "bg-blue-500 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            PRIME
          </div>
        );

      case "disney":
      case "disney+":
      case "disneyplus":
        return (
          <div
            className={cn(
              "bg-blue-700 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            DISNEY+
          </div>
        );

      case "hulu":
        return (
          <div
            className={cn(
              "bg-green-500 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            HULU
          </div>
        );

      case "hbo":
      case "hbomax":
      case "max":
        return (
          <div
            className={cn(
              "bg-purple-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            MAX
          </div>
        );

      case "apple":
      case "appletv":
      case "appletv+":
        return (
          <div
            className={cn(
              "bg-gray-900 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            APPLE TV+
          </div>
        );

      case "paramount":
      case "paramount+":
      case "paramountplus":
        return (
          <div
            className={cn(
              "bg-blue-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            PARAMOUNT+
          </div>
        );

      case "nowtv":
      case "now":
        return (
          <div
            className={cn(
              "bg-pink-500 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            NOW TV
          </div>
        );

      case "youtube":
      case "youtubetv":
        return (
          <div
            className={cn(
              "bg-red-500 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            YOUTUBE
          </div>
        );

      case "peacock":
        return (
          <div
            className={cn(
              "bg-indigo-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            PEACOCK
          </div>
        );

      case "tv":
      case "television":
        return (
          <div
            className={cn(
              "bg-gray-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            TV
          </div>
        );

      case "theater":
      case "cinema":
      case "theaters":
        return (
          <div
            className={cn(
              "bg-orange-600 text-white font-bold px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            THEATERS
          </div>
        );

      default:
        return (
          <div
            className={cn(
              "bg-gray-500 text-white font-medium px-2 py-1 rounded text-xs flex items-center",
              sizeClasses[size],
            )}
          >
            {platform.toUpperCase()}
          </div>
        );
    }
  };

  return (
    <div className={cn("inline-block", className)}>
      {getPlatformIcon(platformName)}
    </div>
  );
}

export function PlatformBadges({
  platforms,
  size = "sm",
  className,
}: {
  platforms: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {platforms.slice(0, 3).map((platform, index) => (
        <PlatformLogo key={index} platform={platform} size={size} />
      ))}
      {platforms.length > 3 && (
        <div className="bg-muted text-muted-foreground font-medium px-2 py-1 rounded text-xs flex items-center">
          +{platforms.length - 3}
        </div>
      )}
    </div>
  );
}
