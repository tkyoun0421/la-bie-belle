"use client";

import { useOnlineStatus } from "@/widgets/offline/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div role="status" className="bg-amber-500 px-4 py-2 text-center text-sm text-white">
      인터넷 연결이 끊겼어요
    </div>
  );
}
