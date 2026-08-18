"use client";

import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { ConnectivityBanner } from "@/shared/ui/connectivity-banner";

type OfflineBannerProps = {
  variant?: "standalone" | "shell-row";
};

export function OfflineBanner({ variant = "standalone" }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();

  if (variant === "standalone") {
    return <ConnectivityBanner status={isOnline ? "online" : "offline"} />;
  }

  if (isOnline) {
    return null;
  }

  return (
    <div role="status" className="h-10 bg-warning-surface typo-caption text-warning">
      <div className="mx-auto flex h-full max-w-screen-sm items-center gap-2 px-4">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8v5" />
          <path d="M12 16.2v.1" />
        </svg>
        <span>인터넷 연결이 끊겼어요 · 지금은 보기만 할 수 있어요</span>
      </div>
    </div>
  );
}
