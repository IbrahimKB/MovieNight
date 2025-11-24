"use client";

import "./globals.css";
import { ReactNode, useEffect } from "react";

import { ToastProvider, ToastViewport } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/contexts/AuthContext";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize cron jobs on client mount
    // We import dynamically to avoid issues during build/SSR
    const initCron = async () => {
      try {
        const { initCronJobs } = await import("@/lib/cron");
        initCronJobs();
        console.log("[APP] ✅ Background jobs initialized");
      } catch (err) {
        console.error("[APP] Failed to initialize background jobs:", err);
      }
    };

    initCron();
  }, []);

  return (
    <html lang="en" className="dark">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <ToastProvider>
                <ToastViewport />
                {children}
              </ToastProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
