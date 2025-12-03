"use client";

import { useRef, useCallback, useEffect } from "react";

export type GestureType = "swipe-left" | "swipe-right" | "swipe-up" | "swipe-down" | "none";

interface GesturePoint {
  x: number;
  y: number;
  time: number;
}

interface UseGestureOptions {
  threshold?: number; // Minimum distance for gesture to register (default: 50)
  timeThreshold?: number; // Maximum time for gesture (default: 500ms)
  onGesture?: (type: GestureType, distance: number) => void;
  enabled?: boolean;
}

export function useGesture(options: UseGestureOptions = {}) {
  const {
    threshold = 50,
    timeThreshold = 500,
    onGesture,
    enabled = true,
  } = options;

  const startPointRef = useRef<GesturePoint | null>(null);
  const currentGestureRef = useRef<GestureType>("none");

  const calculateGestureType = (
    startPoint: GesturePoint,
    endPoint: GesturePoint
  ): { type: GestureType; distance: number } => {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = endPoint.time - startPoint.time;

    // Check if gesture is too slow
    if (timeDelta > timeThreshold) {
      return { type: "none", distance: 0 };
    }

    // Check if distance is below threshold
    if (distance < threshold) {
      return { type: "none", distance: 0 };
    }

    // Determine if horizontal or vertical swipe is dominant
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const isHorizontal = absDeltaX > absDeltaY;

    if (isHorizontal) {
      return {
        type: deltaX > 0 ? "swipe-right" : "swipe-left",
        distance: absDeltaX,
      };
    } else {
      return {
        type: deltaY > 0 ? "swipe-down" : "swipe-up",
        distance: absDeltaY,
      };
    }
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length === 0) return;

      const touch = e.touches[0];
      startPointRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      currentGestureRef.current = "none";
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !startPointRef.current || e.changedTouches.length === 0)
        return;

      const touch = e.changedTouches[0];
      const endPoint: GesturePoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const { type, distance } = calculateGestureType(
        startPointRef.current,
        endPoint
      );

      if (type !== "none") {
        currentGestureRef.current = type;
        onGesture?.(type, distance);
      }

      startPointRef.current = null;
    },
    [enabled, onGesture]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !startPointRef.current || e.touches.length === 0) return;

      // Optional: provide real-time feedback during swipe
      // This can be used for visual feedback like swiping card
      const touch = e.touches[0];
      const currentPoint: GesturePoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const { type } = calculateGestureType(startPointRef.current, currentPoint);
      // Update current gesture if it changes direction
      if (type !== "none") {
        currentGestureRef.current = type;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart as EventListener);
    document.addEventListener("touchend", handleTouchEnd as EventListener);
    document.addEventListener("touchmove", handleTouchMove as EventListener);

    return () => {
      document.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener
      );
      document.removeEventListener("touchend", handleTouchEnd as EventListener);
      document.removeEventListener(
        "touchmove",
        handleTouchMove as EventListener
      );
    };
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchMove]);

  return {
    currentGesture: currentGestureRef.current,
  };
}
