"use client";

import { useOnlineStatus } from "@/widgets/offline/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 bg-[#fff7d6] px-4 py-2 text-center text-sm text-[#765500]"
    >
      인터넷 연결이 끊겼어요
    </div>
  );
}
