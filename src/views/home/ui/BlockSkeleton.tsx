import { SkeletonBar } from "@/shared/ui/skeleton-bar";
import type { HomeBlockName } from "@/views/home/model/home-view-model";

type BlockSkeletonProps = {
  block: HomeBlockName;
  todayLabel: string;
};

const ROW_BLOCK_TITLE: Partial<Record<HomeBlockName, string>> = {
  week: "이번 주",
  upcoming: "다가오는 근무",
  pay: "급여",
};

function WeekCellSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <SkeletonBar className="h-4.5 w-6" />
      <SkeletonBar className="size-8.5 rounded-cell" />
    </div>
  );
}

type RowSkeletonVariant = "upcoming" | "pay";

function SkeletonRow({ variant }: { variant: RowSkeletonVariant }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonBar className="size-8 shrink-0 rounded-cell" />
      <div className="flex flex-1 flex-col gap-1.5">
        {variant === "upcoming" ? (
          <>
            <SkeletonBar className="h-4 w-22" />
            <SkeletonBar className="h-3 w-35" />
          </>
        ) : (
          <>
            <SkeletonBar className="h-3 w-29" />
            <SkeletonBar className="h-4.5 w-23" />
          </>
        )}
      </div>
      {variant === "upcoming" ? <SkeletonBar className="h-8.5 w-13 shrink-0 rounded-pill" /> : null}
    </div>
  );
}

function RowsSkeleton({ variant }: { variant: RowSkeletonVariant }) {
  return (
    <div className="flex flex-col gap-0 rounded-xl bg-surface px-4 py-1">
      <SkeletonRow variant={variant} />
      <SkeletonRow variant={variant} />
      <SkeletonRow variant={variant} />
    </div>
  );
}

export function BlockSkeleton({ block, todayLabel }: BlockSkeletonProps) {
  if (block === "notices") {
    return (
      <div className="flex h-17.5 flex-row items-center gap-3 rounded-xl bg-surface p-4">
        <SkeletonBar className="size-7 shrink-0 rounded-pill" />
        <div className="flex flex-1 flex-col gap-1.5">
          <SkeletonBar className="h-4 w-3/5" />
          <SkeletonBar className="h-3 w-2/5" />
        </div>
      </div>
    );
  }

  if (block === "today") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">오늘 · {todayLabel}</p>
        <div className="flex flex-col gap-2 rounded-xl bg-surface p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <SkeletonBar className="h-6.5 w-32" />
              <SkeletonBar className="h-3 w-21" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <SkeletonBar className="h-4 w-15.5" />
              <SkeletonBar className="h-3 w-23" />
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border pt-2.5">
            <SkeletonBar className="h-5.5 w-18.5 rounded-pill" />
            <SkeletonBar className="h-3 flex-1" />
          </div>
          <SkeletonBar className="mt-1 h-13 rounded-lg" />
        </div>
      </div>
    );
  }

  if (block === "week") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">{ROW_BLOCK_TITLE.week}</p>
        <div className="flex flex-col gap-0 rounded-xl bg-surface px-4 py-3">
          <div className="flex gap-0.5">
            <WeekCellSkeleton />
            <WeekCellSkeleton />
            <WeekCellSkeleton />
            <WeekCellSkeleton />
            <WeekCellSkeleton />
            <WeekCellSkeleton />
            <WeekCellSkeleton />
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-3">
            <SkeletonBar className="h-3 w-27" />
            <SkeletonBar className="h-4.5 w-19" />
          </div>
        </div>
      </div>
    );
  }

  const rowVariant: RowSkeletonVariant = block === "upcoming" ? "upcoming" : "pay";

  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">{ROW_BLOCK_TITLE[block]}</p>
      <RowsSkeleton variant={rowVariant} />
    </div>
  );
}
