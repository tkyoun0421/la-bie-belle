"use client";

import { Suspense } from "react";

import { useAmountMasking } from "@/shared/hooks/useAmountMasking";
import { useAmountReveal } from "@/shared/hooks/useAmountReveal";
import { BlockBoundary } from "@/shared/ui/block-boundary";
import { useNoticeDeck } from "@/views/home/hooks/useNoticeDeck";
import { useWeekSelection } from "@/views/home/hooks/useWeekSelection";
import { formatWindowOpensAt, toCountdown } from "@/views/home/model/countdown";
import { toFullDateLabel } from "@/views/home/model/date-labels";
import { toHomeBlocks } from "@/views/home/model/home-blocks";
import type { HomeBlockName, HomeViewModel } from "@/views/home/model/home-view-model";
import { toUpcomingShifts } from "@/views/home/model/upcoming-shifts";
import { toWeekFooter, toWeekStripCells } from "@/views/home/model/week-strip";
import { BlockSkeleton } from "@/views/home/ui/BlockSkeleton";
import { NoticeBlock } from "@/views/home/ui/NoticeBlock";
import { PayBlock } from "@/views/home/ui/PayBlock";
import { TodayBlock } from "@/views/home/ui/TodayBlock";
import { UpcomingBlock } from "@/views/home/ui/UpcomingBlock";
import { WeekStripBlock } from "@/views/home/ui/WeekStripBlock";
import { RouterPullToRefresh } from "@/widgets/pull-to-refresh/ui/RouterPullToRefresh";

const BLOCK_FAILURE_MESSAGE: Record<HomeBlockName, string> = {
  notices: "알림을 불러오지 못했어요",
  today: "오늘 근무를 불러오지 못했어요",
  week: "이번 주를 불러오지 못했어요",
  upcoming: "다가오는 근무를 불러오지 못했어요",
  pay: "급여를 불러오지 못했어요",
};

type HomeViewProps = {
  model: HomeViewModel;
  now: Date;
  today: string;
  noticeIds: readonly string[];
};

export function HomeView({ model, now, today, noticeIds }: HomeViewProps) {
  const plan = toHomeBlocks(model, now);
  const todayLabel = toFullDateLabel(today);

  const noticeDeck = useNoticeDeck(noticeIds, today);

  const weekDays = model.week.state === "ready" ? model.week.data.days : [];
  const weekSelection = useWeekSelection(weekDays);
  const weekCells = toWeekStripCells(weekDays);
  const weekFooter = toWeekFooter({ days: weekDays }, weekSelection.selectedDate);

  const upcomingShifts =
    model.upcoming.state === "ready" ? toUpcomingShifts(model.upcoming.data, today) : [];

  const shift = model.today.state === "ready" ? model.today.data : null;
  const countdown = shift === null ? null : toCountdown(shift.attendanceWindow, now);
  const windowOpensAtLabel = shift === null ? null : formatWindowOpensAt(shift.attendanceWindow);

  const payRows = model.pay.state === "ready" ? model.pay.data.rows : [];

  const autoMaskOnWorkday = useAmountMasking((state) => state.autoMaskOnWorkday);
  const isWorkday = shift !== null;
  const reveal = useAmountReveal(autoMaskOnWorkday && isWorkday);

  return (
    <RouterPullToRefresh>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-3 p-4 pb-nav-action-safe">
        {plan.map((entry) => (
          <Suspense
            key={entry.block}
            fallback={<BlockSkeleton block={entry.block} todayLabel={todayLabel} today={today} />}
          >
            <BlockBoundary message={BLOCK_FAILURE_MESSAGE[entry.block]}>
              {entry.status === "loading" ? (
                <BlockSkeleton block={entry.block} todayLabel={todayLabel} today={today} />
              ) : entry.block === "notices" ? (
                <NoticeBlock
                  status={entry.status === "failed" ? "failed" : "filled"}
                  notices={model.notices.state === "ready" ? model.notices.data : []}
                  deck={noticeDeck}
                />
              ) : entry.block === "today" ? (
                <TodayBlock
                  status={entry.status === "failed" ? "failed" : "filled"}
                  shift={shift}
                  todayLabel={todayLabel}
                  countdown={countdown}
                  windowOpensAtLabel={windowOpensAtLabel}
                />
              ) : entry.block === "week" ? (
                <WeekStripBlock
                  status={entry.status}
                  cells={weekCells}
                  today={today}
                  footer={weekFooter}
                  selectedDate={weekSelection.selectedDate}
                  onSelect={weekSelection.select}
                  reveal={reveal}
                />
              ) : entry.block === "upcoming" ? (
                <UpcomingBlock status={entry.status} shifts={upcomingShifts} />
              ) : (
                <PayBlock status={entry.status} rows={payRows} reveal={reveal} />
              )}
            </BlockBoundary>
          </Suspense>
        ))}
      </main>
    </RouterPullToRefresh>
  );
}
