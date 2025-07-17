import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Smartphone, Wifi, WifiOff, RefreshCw, Trash2 } from "lucide-react";
import {
  isPWAMode,
  getServiceWorkerRegistration,
  updateServiceWorker,
  clearPWACache,
  getCacheInfo,
} from "@/lib/pwa";

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWA, setIsPWA] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [cacheInfo, setCacheInfo] = useState({
    cacheNames: [] as string[],
    totalSize: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Check PWA mode
    setIsPWA(isPWAMode());

    // Get service worker registration
    getServiceWorkerRegistration().then(setSwRegistration);

    // Get cache info
    getCacheInfo().then(setCacheInfo);

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearPWACache();
      const newCacheInfo = await getCacheInfo();
      setCacheInfo(newCacheInfo);
    } catch (error) {
      console.error("Clear cache failed:", error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Smartphone className="h-4 w-4" />
          {isPWA ? (
            <Badge variant="secondary" className="text-xs">
              PWA
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              WEB
            </Badge>
          )}
          {isOnline ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>App Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* App Mode */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">App Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isPWA ? "Progressive Web App" : "Browser Tab"}
                </span>
                <Badge variant={isPWA ? "default" : "outline"}>
                  {isPWA ? "PWA" : "WEB"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Network Status
                </span>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <Badge className="bg-green-500">Online</Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Offline</Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Worker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={swRegistration ? "default" : "outline"}>
                    {swRegistration ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {swRegistration && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scope</span>
                    <span className="text-xs font-mono">
                      {swRegistration.scope}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cache Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cache Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Caches</span>
                  <Badge variant="outline">{cacheInfo.cacheNames.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Items</span>
                  <Badge variant="outline">{cacheInfo.totalSize}</Badge>
                </div>
                {cacheInfo.cacheNames.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {cacheInfo.cacheNames.slice(0, 2).join(", ")}
                    {cacheInfo.cacheNames.length > 2 && "..."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating || !swRegistration}
              className="flex-1"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearing || cacheInfo.cacheNames.length === 0}
              className="flex-1"
            >
              {isClearing ? (
                <Trash2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Cache
            </Button>
          </div>

          {!isOnline && (
            <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              ⚠️ You're offline. The app is running in cached mode.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
