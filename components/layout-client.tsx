"use client";

import { ReactNode } from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { AuthProvider } from "@/app/contexts/AuthContext";

const queryClient = new QueryClient();

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ToastProvider>
            <ToastViewport />
            <ServiceWorkerRegister />
            {children}
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
