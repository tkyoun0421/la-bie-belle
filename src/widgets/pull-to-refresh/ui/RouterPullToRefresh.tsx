"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { PullToRefresh } from "@/widgets/pull-to-refresh/ui/PullToRefresh";

type RouterPullToRefreshProps = {
  children: ReactNode;
};

export function RouterPullToRefresh({ children }: RouterPullToRefreshProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();

  return (
    <PullToRefresh isOnline={isOnline} onRefresh={async () => router.refresh()}>
      {children}
    </PullToRefresh>
  );
}
