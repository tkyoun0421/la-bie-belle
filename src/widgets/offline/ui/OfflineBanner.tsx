"use client";

import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { ConnectivityBanner } from "@/shared/ui/connectivity-banner";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return <ConnectivityBanner status={isOnline ? "online" : "offline"} />;
}
