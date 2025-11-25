import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { LayoutClient } from "@/components/layout-client";
import { initCronJobs } from "@/lib/cron";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "MovieNight - Watch Together, Decide Together",
  description:
    "Discover movies with friends. Create squads, share suggestions, and vote on what to watch next.",
  applicationName: "MovieNight",
  authors: [{ name: "MovieNight Team" }],
  keywords: [
    "movies",
    "watch party",
    "social",
    "recommendations",
    "cinema",
    "squad",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icons/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "/icons/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/icon.svg",
        color: "#3b82f6",
      },
      {
        rel: "icon",
        url: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MovieNight",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://movienight.app",
    title: "MovieNight",
    description:
      "Discover movies with friends. Watch together, decide together.",
    siteName: "MovieNight",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "MovieNight Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieNight",
    description:
      "Discover movies with friends. Watch together, decide together.",
    images: ["/icons/icon-512x512.png"],
  },
};

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
