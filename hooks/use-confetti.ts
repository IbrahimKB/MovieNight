import { useCallback } from "react";
import confetti from "canvas-confetti";

export const useConfetti = () => {
  const trigger = useCallback((options = {}) => {
    const defaults = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...options,
    };
    confetti(defaults);
  }, []);

  const triggerCheckmark = useCallback(() => {
    // Left confetti burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.2, y: 0.6 },
    });
    // Right confetti burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.8, y: 0.6 },
    });
  }, []);

  const triggerPaperAirplane = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 },
      shapes: ["star", "circle"],
    });
  }, []);

  return { trigger, triggerCheckmark, triggerPaperAirplane };
};
