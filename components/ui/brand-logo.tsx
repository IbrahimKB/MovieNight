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
      {/* Define gradients for depth */}
      <defs>
        <linearGradient id="reel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#3b82f6", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#1e40af", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0%" style={{ stopColor: "#60a5fa", stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: "#3b82f6", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx="256" cy="256" r="256" fill="currentColor" opacity="0.05" />

      {/* Outer film reel circles */}
      <circle
        cx="256"
        cy="256"
        r="200"
        fill="url(#reel-gradient)"
        opacity="0.1"
      />

      {/* Main reel ring */}
      <circle
        cx="256"
        cy="256"
        r="180"
        fill="none"
        stroke="url(#reel-gradient)"
        strokeWidth="24"
      />

      {/* Reel film perforations (top, right, bottom, left) */}
      <g fill="currentColor" opacity="0.7">
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
        <circle cx="0" cy="0" r="70" fill="currentColor" opacity="0.1" />

        {/* Play triangle */}
        <path
          d="M -20 -35 L -20 35 L 40 0 Z"
          fill="currentColor"
          opacity="0.9"
        />
      </g>

      {/* Connection nodes (representing social) - subtle highlights */}
      <g fill="currentColor" opacity="0.5">
        {/* Top-right */}
        <circle cx="350" cy="170" r="12" />
        {/* Bottom-right */}
        <circle cx="350" cy="342" r="12" />
        {/* Bottom-left */}
        <circle cx="162" cy="342" r="12" />
        {/* Top-left */}
        <circle cx="162" cy="170" r="12" />
      </g>

      {/* Connecting lines between nodes (subtle) */}
      <g stroke="currentColor" strokeWidth="3" opacity="0.25" strokeLinecap="round">
        <line x1="350" y1="170" x2="350" y2="342" />
        <line x1="350" y1="342" x2="162" y2="342" />
        <line x1="162" y1="342" x2="162" y2="170" />
        <line x1="162" y1="170" x2="350" y2="170" />
      </g>

      {/* Optional glow effect for premium feel */}
      <circle
        cx="256"
        cy="256"
        r="180"
        fill="url(#glow)"
        pointerEvents="none"
      />
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
