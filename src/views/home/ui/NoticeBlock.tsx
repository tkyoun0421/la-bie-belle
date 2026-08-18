"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/cn";
import { AnchorIllustration, type IllustrationName } from "@/shared/ui/anchor-illustration";
import type { UseNoticeDeckResult } from "@/views/home/hooks/useNoticeDeck";
import { toNoticeContent } from "@/views/home/model/notice-content";
import type { NoticeItem } from "@/views/home/model/home-view-model";
import { FailedRow } from "@/views/home/ui/FailedRow";

type NoticeBlockProps = {
  status: "filled" | "failed";
  notices: readonly NoticeItem[];
  deck: UseNoticeDeckResult;
};

function illustrationOf(kind: NoticeItem["kind"]): IllustrationName {
  switch (kind) {
    case "vacancy":
      return "vacancy";
    case "schedule-confirmed":
      return "schedule-confirmed";
    case "assignment-changed":
      return "assignment-changed";
    case "change-approved":
      return "change-approved";
    case "change-rejected":
      return "change-rejected";
  }
}

type NoticeCardProps = {
  notice: NoticeItem;
  current: boolean;
  entering: boolean;
  leaving: boolean;
  onDismiss: () => void;
  onSettle: () => void;
};

function NoticeCard({ notice, current, entering, leaving, onDismiss, onSettle }: NoticeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) {
      return;
    }
    el.addEventListener("animationend", onSettle);
    return () => el.removeEventListener("animationend", onSettle);
  }, [onSettle]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute inset-0 flex flex-row items-center gap-3 rounded-xl bg-surface py-3 pr-2 pl-4",
        entering ? "motion-notice-in" : "",
        leaving ? "motion-notice-out" : "",
      )}
    >
      <AnchorIllustration name={illustrationOf(notice.kind)} size={28} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="typo-body text-text-strong">{toNoticeContent(notice).value}</p>
        <p className="typo-caption text-text-muted">{toNoticeContent(notice).caption}</p>
      </div>
      {current ? (
        <button
          type="button"
          aria-label="알림 끄기"
          onClick={onDismiss}
          className="flex size-11 shrink-0 items-center justify-center rounded-pill text-text-weak transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.88]"
        >
          <X aria-hidden className="size-[17px]" strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );
}

export function NoticeBlock({ status, notices, deck }: NoticeBlockProps) {
  if (status === "failed") {
    return (
      <div className="rounded-xl bg-surface px-4 py-1">
        <FailedRow message="알림을 불러오지 못했어요" />
      </div>
    );
  }

  const collapsed = deck.currentId === null && deck.leavingId === null;

  return (
    <div
      data-testid="notice-slot"
      className={cn("motion-notice-slot h-17.5", collapsed ? "motion-notice-collapsed" : "")}
    >
      {notices.map((notice) => {
        const isCurrent = notice.id === deck.currentId;
        const isLeaving = notice.id === deck.leavingId;
        if (!isCurrent && !isLeaving) {
          return null;
        }

        return (
          <NoticeCard
            key={notice.id}
            notice={notice}
            current={isCurrent}
            entering={isCurrent && deck.phase === "entering"}
            leaving={isLeaving}
            onDismiss={deck.dismiss}
            onSettle={deck.settle}
          />
        );
      })}
    </div>
  );
}
