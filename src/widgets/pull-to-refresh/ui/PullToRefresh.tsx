"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { showSnackbar } from "@/shared/ui/snackbar";
import { usePullToRefresh } from "@/widgets/pull-to-refresh/hooks/usePullToRefresh";

const INDICATOR_HEIGHT = 40;

type PullToRefreshProps = {
  onRefresh: () => Promise<void> | void;
  isOnline: boolean;
  children: ReactNode;
};

export function PullToRefresh({ onRefresh, isOnline, children }: PullToRefreshProps) {
  const { phase, distance, handlers } = usePullToRefresh({
    onRefresh,
    isOnline,
    onOfflineAttempt: () => showSnackbar("오프라인 상태예요. 연결을 확인한 뒤 다시 시도해주세요"),
  });

  const pullDistance = phase === "idle" ? 0 : Math.min(distance, INDICATOR_HEIGHT);

  return (
    <div {...handlers} className="relative overflow-hidden" style={{ touchAction: "pan-y" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2 opacity-0 transition-[transform,opacity] duration-[var(--duration-feedback)] ease-[var(--ease-spring)]"
        style={{
          transform: `translateY(${pullDistance - INDICATOR_HEIGHT}px)`,
          opacity: phase === "idle" ? 0 : 1,
        }}
      >
        {phase === "refreshing" ? (
          <Loader2 aria-hidden className="size-5 animate-spin text-action" />
        ) : (
          <span className="typo-caption text-text">
            {phase === "ready" ? "놓으면 새로고침" : "당겨서 새로고침"}
          </span>
        )}
      </div>
      <div
        className="transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-spring)]"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
      {phase === "refreshing" ? (
        <p role="status" aria-live="polite" className="sr-only">
          새로고침하고 있어요
        </p>
      ) : null}
    </div>
  );
}
