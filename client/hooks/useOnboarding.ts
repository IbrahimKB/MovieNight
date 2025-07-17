import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  shouldShowOnboarding: boolean;
  markOnboardingComplete: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): OnboardingState {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true); // Default to true to prevent flash
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // Storage key for onboarding completion
  const getStorageKey = (userId: string) => `movienight_onboarding_${userId}`;

  useEffect(() => {
    if (!user?.id) {
      setShouldShowOnboarding(false);
      return;
    }

    const storageKey = getStorageKey(user.id);
    const completed = localStorage.getItem(storageKey);
    const hasCompleted = completed === "true";

    // Check if user account is new (within last 10 minutes)
    const joinedAt = new Date(user.joinedAt);
    const now = new Date();
    const timeDifference = now.getTime() - joinedAt.getTime();
    const isNewUser = timeDifference < 10 * 60 * 1000; // 10 minutes

    setHasCompletedOnboarding(hasCompleted);

    // Show onboarding if:
    // 1. User hasn't completed it AND
    // 2. User is new (joined within last 10 minutes) OR hasn't completed onboarding
    setShouldShowOnboarding(!hasCompleted && (isNewUser || !hasCompleted));
  }, [user]);

  const markOnboardingComplete = () => {
    if (!user?.id) return;

    const storageKey = getStorageKey(user.id);
    localStorage.setItem(storageKey, "true");
    setHasCompletedOnboarding(true);
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    if (!user?.id) return;

    const storageKey = getStorageKey(user.id);
    localStorage.setItem(storageKey, "true");
    localStorage.setItem(`${storageKey}_skipped`, "true");
    setHasCompletedOnboarding(true);
    setShouldShowOnboarding(false);
  };

  const resetOnboarding = () => {
    if (!user?.id) return;

    const storageKey = getStorageKey(user.id);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_skipped`);
    setHasCompletedOnboarding(false);
    setShouldShowOnboarding(true);
  };

  return {
    hasCompletedOnboarding,
    shouldShowOnboarding,
    markOnboardingComplete,
    skipOnboarding,
    resetOnboarding,
  };
}
