import "./globals.css";
import { ReactNode } from "react";
import { LayoutClient } from "@/components/layout-client";
import { initCronJobs } from "@/lib/cron";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Initialize cron jobs on server startup
  initCronJobs();

  return (
    <html lang="en" className="dark">
      <body>
        <LayoutClient>
          <ServiceWorkerRegister />
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
