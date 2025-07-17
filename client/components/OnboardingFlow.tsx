import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Calendar,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Film,
  Bookmark,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingFlow({
  onComplete,
  onSkip,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const { user } = useAuth();

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to MovieNight! 🎬",
      description:
        "Let's get you started with discovering and planning movie nights with friends",
      icon: Film,
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Film className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hello {user?.name?.split(" ")[0] || "there"}! MovieNight helps
              you:
            </p>
            <ul className="text-sm space-y-1 text-left max-w-sm mx-auto">
              <li className="flex items-center gap-2">
                <CheckCircle
                  className="h-4 w-4 text-green-500"
                  aria-hidden="true"
                />
                Discover new movies
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle
                  className="h-4 w-4 text-green-500"
                  aria-hidden="true"
                />
                Share suggestions with friends
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle
                  className="h-4 w-4 text-green-500"
                  aria-hidden="true"
                />
                Plan movie nights together
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle
                  className="h-4 w-4 text-green-500"
                  aria-hidden="true"
                />
                Track what you've watched
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "discover",
      title: "Discover Movies",
      description: "Find your next favorite movie with our discovery tools",
      icon: Search,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-accent/50 p-3 rounded-lg text-center">
              <Search
                className="h-6 w-6 mx-auto mb-2 text-primary"
                aria-hidden="true"
              />
              <h4 className="font-medium text-sm">Search</h4>
              <p className="text-xs text-muted-foreground">
                Find specific movies
              </p>
            </div>
            <div className="bg-accent/50 p-3 rounded-lg text-center">
              <Star
                className="h-6 w-6 mx-auto mb-2 text-primary"
                aria-hidden="true"
              />
              <h4 className="font-medium text-sm">Trending</h4>
              <p className="text-xs text-muted-foreground">
                See what's popular
              </p>
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              Pro tip: Check out the "Releases" tab for upcoming movies!
            </Badge>
          </div>
        </div>
      ),
      action: {
        label: "Explore Movies",
        href: "/movie-search",
      },
    },
    {
      id: "friends",
      title: "Connect with Friends",
      description:
        "Add friends to share movie suggestions and plan movie nights",
      icon: UserPlus,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
              <Users className="h-8 w-8 text-blue-500" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              MovieNight is better with friends! Add them to:
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <PlusCircle
                className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <span className="font-medium">Share suggestions</span>
                <p className="text-muted-foreground text-xs">
                  Recommend movies to each other
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar
                className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <span className="font-medium">Plan movie nights</span>
                <p className="text-muted-foreground text-xs">
                  Coordinate viewing sessions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star
                className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0"
                aria-hidden="true"
              />
              <div>
                <span className="font-medium">See what they're watching</span>
                <p className="text-muted-foreground text-xs">
                  Stay updated on their activity
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Add Friends",
        href: "/squad",
      },
    },
    {
      id: "suggest",
      title: "Make Your First Suggestion",
      description: "Share a movie recommendation with your friends",
      icon: PlusCircle,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
              <PlusCircle
                className="h-8 w-8 text-green-500"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Once you have friends, you can start suggesting movies to them!
            </p>
          </div>
          <div className="bg-accent/30 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Suggestion Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Include why you think they'll like it</li>
              <li>• Consider their movie preferences</li>
              <li>• Add watching urgency (tonight, this week, etc.)</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Make Suggestion",
        href: "/suggest",
      },
    },
    {
      id: "watchlist",
      title: "Build Your Watchlist",
      description: "Save movies you want to watch for later",
      icon: Bookmark,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
              <Bookmark
                className="h-8 w-8 text-orange-500"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Never forget a movie you want to watch!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-accent/50 p-2 rounded text-center">
              <span className="font-medium">Personal</span>
              <p className="text-muted-foreground">Your private list</p>
            </div>
            <div className="bg-accent/50 p-2 rounded text-center">
              <span className="font-medium">Shared</span>
              <p className="text-muted-foreground">With friends</p>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "View Watchlist",
        href: "/watchlist",
      },
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!completedSteps.includes(currentStepData.id)) {
      setCompletedSteps([...completedSteps, currentStepData.id]);
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleActionClick = () => {
    if (currentStepData.action?.onClick) {
      currentStepData.action.onClick();
    }
    handleNext();
  };

  useEffect(() => {
    // Mark first step as visited
    if (currentStep === 0 && !completedSteps.includes("welcome")) {
      setCompletedSteps(["welcome"]);
    }
  }, [currentStep, completedSteps]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Getting Started</span>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={steps.length}
              aria-label={`Step ${currentStep + 1} of ${steps.length}`}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(step.id);
              const isVisited = index <= currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : isVisited
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/50 text-muted-foreground/50",
                  )}
                  disabled={!isVisited}
                  aria-label={`Go to ${step.title}`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentStepData.description}
            </p>
          </CardHeader>
          <CardContent>{currentStepData.content}</CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
              aria-label="Go to previous step"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} className="text-sm">
              Skip Tour
            </Button>

            {currentStepData.action ? (
              <Button
                onClick={handleActionClick}
                className="flex items-center gap-2"
              >
                {currentStepData.action.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex items-center gap-2">
                {isLastStep ? "Get Started" : "Next"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Accessibility announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Currently on step {currentStep + 1}: {currentStepData.title}
        </div>
      </div>
    </div>
  );
}
