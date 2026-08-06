"use client";

import { ConnectivityBanner } from "@/shared/ui/connectivity-banner";
import { useOnlineStatus } from "@/widgets/offline/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return <ConnectivityBanner status={isOnline ? "online" : "offline"} />;
}
