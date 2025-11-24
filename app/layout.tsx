"use client";

import "./globals.css";
import { ReactNode } from "react";

import { ToastProvider, ToastViewport } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/app/contexts/AuthContext";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
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
