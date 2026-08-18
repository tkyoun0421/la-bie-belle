"use client";

import { X } from "lucide-react";

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

export function NoticeBlock({ status, notices, deck }: NoticeBlockProps) {
  if (status === "failed") {
    return (
      <div className="rounded-xl bg-surface px-4 py-1">
        <FailedRow message="알림을 불러오지 못했어요" />
      </div>
    );
  }

  return (
    <>
      {notices.map((notice) =>
        notice.id === deck.currentId ? (
          <div
            key={notice.id}
            className="flex flex-row items-center gap-3 rounded-xl bg-surface py-3 pr-2 pl-4"
          >
            <AnchorIllustration name={illustrationOf(notice.kind)} size={28} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="typo-body text-text-strong">{toNoticeContent(notice).value}</p>
              <p className="typo-caption text-text-muted">{toNoticeContent(notice).caption}</p>
            </div>
            <button
              type="button"
              aria-label="알림 끄기"
              onClick={deck.dismiss}
              className="flex size-11 shrink-0 items-center justify-center rounded-pill text-text-weak"
            >
              <X aria-hidden className="size-[17px]" strokeWidth={1.8} />
            </button>
          </div>
        ) : null,
      )}
    </>
  );
}
