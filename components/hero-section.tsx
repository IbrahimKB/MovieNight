"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background flex flex-col">
      {/* Background Gradient + Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D] via-[#0A0A0A] to-[#111111]">
        {/* Radial glow effect from center */}
        <div className="absolute inset-0 bg-radial-gradient opacity-40" />

        {/* Top right glow */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl opacity-20" />

        {/* Bottom left glow */}
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-15" />
      </div>

      {/* Blurred Poster Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Left side posters */}
        <div className="absolute -left-20 top-10 w-64 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl opacity-10 blur-3xl transform -rotate-12" />
        <div className="absolute -left-32 bottom-20 w-72 h-96 bg-gradient-to-tr from-primary/15 to-transparent rounded-2xl opacity-8 blur-3xl transform rotate-6" />

        {/* Right side posters */}
        <div className="absolute -right-20 top-32 w-80 h-96 bg-gradient-to-bl from-primary/15 to-primary/5 rounded-2xl opacity-10 blur-3xl transform rotate-12" />
        <div className="absolute -right-40 bottom-10 w-72 h-96 bg-gradient-to-tl from-primary/10 to-transparent rounded-2xl opacity-8 blur-3xl transform -rotate-6" />

        {/* Center subtle posters */}
        <div className="absolute left-1/4 top-1/4 w-48 h-72 bg-gradient-to-b from-primary/10 to-transparent rounded-xl opacity-5 blur-2xl" />
        <div className="absolute right-1/3 bottom-1/3 w-56 h-80 bg-gradient-to-t from-primary/10 to-transparent rounded-xl opacity-5 blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-12 sm:py-20">
        {/* Logo Badge */}
        <div className="mb-8 sm:mb-12 flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 backdrop-blur-sm">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">
            🎬
          </div>
          <span className="text-sm font-semibold text-primary">MovieNight</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-center mb-4 sm:mb-6 max-w-4xl leading-tight">
          <span className="text-foreground">Your Movies.</span>
          <br />
          <span className="text-foreground">Your Friends.</span>
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Your Night.
          </span>
        </h1>

        {/* Sub-Headline */}
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl leading-relaxed">
          Discover films, track what you watch, and plan movie nights together.
          <br className="hidden sm:block" />
          Connect with friends over great cinema.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
          {/* Primary CTA */}
          <button
            onClick={() => router.push("/signup")}
            className="group relative px-8 sm:px-10 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/40 hover:shadow-primary/60"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-primary opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />

            <span className="relative flex items-center gap-2">
              Get Started
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform duration-300"
              />
            </span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => router.push("/login")}
            className="px-8 sm:px-10 py-3 sm:py-4 rounded-xl border border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary/80 font-bold text-base sm:text-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Browse Movies
          </button>
        </div>

        {/* Secondary Link */}
        <button
          onClick={() => router.push("/login")}
          className="text-sm sm:text-base text-primary hover:text-primary/80 font-medium transition-colors duration-300 flex items-center gap-2 group"
        >
          Already have an account?
          <span className="group-hover:translate-x-1 transition-transform duration-300">
            →
          </span>
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Floating cards accent (optional subtle animation) */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-center gap-4 sm:gap-8 z-20">
        <div className="hidden sm:flex items-center gap-3 bg-card/40 border border-border/50 rounded-lg px-6 py-3 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs sm:text-sm text-muted-foreground">
            Join thousands of movie enthusiasts
          </span>
        </div>
      </div>
    </div>
  );
}
