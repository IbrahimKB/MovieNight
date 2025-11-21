'use client';

import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">MovieNight</h1>
          <div className="flex gap-4">
            <a href="/movies" className="text-sm hover:text-primary transition-colors">
              Movies
            </a>
            <a href="/calendar" className="text-sm hover:text-primary transition-colors">
              Calendar
            </a>
            <a href="/suggestions" className="text-sm hover:text-primary transition-colors">
              Suggestions
            </a>
            <a href="/watchlist" className="text-sm hover:text-primary transition-colors">
              Watchlist
            </a>
            <a href="/friends" className="text-sm hover:text-primary transition-colors">
              Friends
            </a>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm hover:text-primary transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
