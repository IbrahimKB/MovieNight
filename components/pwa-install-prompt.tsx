"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissedUntilRaw = window.localStorage.getItem(
      "movienight_pwa_dismissed_until",
    );
    if (dismissedUntilRaw) {
      const dismissedUntil = Number(dismissedUntilRaw);
      if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) {
        setDismissed(true);
      }
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setIsIOS(ios);
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      (window as Window & { __movienightDeferredPrompt?: BeforeInstallPromptEvent }).__movienightDeferredPrompt =
        installEvent;
      window.dispatchEvent(new Event("movienight:pwa-install-ready"));
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      window.localStorage.removeItem("movienight_pwa_dismissed_until");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showIosHint = useMemo(
    () => !isStandalone && isIOS && !dismissed,
    [dismissed, isIOS, isStandalone],
  );
  const showInstallCta = useMemo(
    () => !isStandalone && !!deferredPrompt && !dismissed,
    [deferredPrompt, dismissed, isStandalone],
  );

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    (window as Window & { __movienightDeferredPrompt?: BeforeInstallPromptEvent }).__movienightDeferredPrompt =
      undefined;
  };

  const handleDismiss = () => {
    setDismissed(true);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(
      "movienight_pwa_dismissed_until",
      String(Date.now() + sevenDaysMs),
    );
  };

  if (!showIosHint && !showInstallCta) return null;

  return (
    <div className="fixed z-[70] bottom-24 md:bottom-4 right-3 left-3 md:left-auto md:w-[360px]">
      <div className="rounded-xl border border-primary/20 bg-card/95 backdrop-blur p-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Install MovieNight</p>
            {showInstallCta ? (
              <p className="text-xs text-muted-foreground">
                Install the app for faster launches and full-screen mode.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                On iPhone: tap <Share2 className="inline h-3 w-3" /> then
                "Add to Home Screen".
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showInstallCta && (
          <button
            onClick={handleInstall}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
