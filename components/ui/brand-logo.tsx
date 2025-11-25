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
 * MovieNight Brand Logo - Modern Minimalist Cinema Design
 * Concept: Sleek film frame with play button - representing cinema + action
 * Clean geometric design with primary brand colors
 */
export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn(sizeMap[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MovieNight"
    >
      <defs>
        <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "currentColor", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "currentColor", stopOpacity: 0.7 }} />
        </linearGradient>
      </defs>

      {/* Outer frame - minimalist cinema screen */}
      <rect
        x="6"
        y="8"
        width="52"
        height="48"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.8"
      />

      {/* Inner film strips - top and bottom */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.6">
        <line x1="8" y1="14" x2="56" y2="14" strokeDasharray="3,2" />
        <line x1="8" y1="50" x2="56" y2="50" strokeDasharray="3,2" />
      </g>

      {/* Center play button - modern geometric triangle */}
      <g fill="currentColor">
        <polygon points="28,24 28,40 42,32" opacity="0.9" />
      </g>

      {/* Accent corner brackets - cinema frame detail */}
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.5">
        {/* Top-left */}
        <line x1="8" y1="10" x2="14" y2="10" />
        <line x1="8" y1="10" x2="8" y2="16" />
        {/* Top-right */}
        <line x1="56" y1="10" x2="50" y2="10" />
        <line x1="56" y1="10" x2="56" y2="16" />
        {/* Bottom-left */}
        <line x1="8" y1="54" x2="14" y2="54" />
        <line x1="8" y1="54" x2="8" y2="48" />
        {/* Bottom-right */}
        <line x1="56" y1="54" x2="50" y2="54" />
        <line x1="56" y1="54" x2="56" y2="48" />
      </g>

      {/* Subtle glow circle behind play button */}
      <circle cx="32" cy="32" r="10" fill="currentColor" opacity="0.08" />
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
