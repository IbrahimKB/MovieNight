"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

/**
 * MovieNight Brand Logo
 * Concept: Film reel meets connection node - representing cinema + social
 * Uses primary brand colors and scales responsively
 *
 * Note: This component is for client-side only (used in app layout navbar).
 * For SSR pages (auth pages), use the Clapperboard icon instead.
 */
export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn(sizeMap[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MovieNight"
    >
      {/* Main reel ring */}
      <circle
        cx="256"
        cy="256"
        r="180"
        fill="none"
        stroke="currentColor"
        strokeWidth="24"
      />

      {/* Reel film perforations (top, right, bottom, left) */}
      <g fill="currentColor" opacity="0.8">
        {/* Top hole */}
        <rect x="240" y="95" width="32" height="32" rx="4" />
        {/* Right hole */}
        <rect x="385" y="240" width="32" height="32" rx="4" />
        {/* Bottom hole */}
        <rect x="240" y="385" width="32" height="32" rx="4" />
        {/* Left hole */}
        <rect x="95" y="240" width="32" height="32" rx="4" />
      </g>

      {/* Central play button (representing cinema) */}
      <g transform="translate(256, 256)">
        {/* Play triangle */}
        <path
          d="M -20 -35 L -20 35 L 40 0 Z"
          fill="currentColor"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

/**
 * Logo text variant - used in header/branding contexts
 */
export function BrandLogoWithText({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandLogo size="lg" className="text-primary" />
      <span className="text-xl font-black tracking-tight">MovieNight</span>
    </div>
  );
}
