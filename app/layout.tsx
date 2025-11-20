import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'MovieNight - Discover & Share Movies with Friends',
  description: 'Discover movies, suggest to friends, and build your perfect movie night with MovieNight.',
  applicationName: 'MovieNight',
  themeColor: '#dc2626',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MovieNight',
  },
  icons: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/movienight-favicon.svg',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/pwa-icon-192.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="dark">
        {children}
      </body>
    </html>
  );
}
