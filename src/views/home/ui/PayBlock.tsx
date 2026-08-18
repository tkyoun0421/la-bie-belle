import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import type { UseAmountRevealResult } from "@/shared/hooks/useAmountReveal";
import { AnchorIllustration, type IllustrationName } from "@/shared/ui/anchor-illustration";
import { MaskedAmount } from "@/shared/ui/masked-amount";
import { formatWon } from "@/views/home/model/format-won";
import type { PayRow } from "@/views/home/model/home-view-model";
import { toPayRowLabel } from "@/views/home/model/pay-row-label";
import { EmptyRow } from "@/views/home/ui/EmptyRow";
import { FailedRow } from "@/views/home/ui/FailedRow";

type PayBlockProps = {
  status: "filled" | "empty" | "failed";
  rows: readonly PayRow[];
  reveal: UseAmountRevealResult;
};

function illustrationOf(kind: PayRow["kind"]): IllustrationName {
  switch (kind) {
    case "last-week":
      return "pay-last-week";
    case "this-month":
      return "pay-month-total";
    case "year-to-date":
      return "pay-cumulative";
  }
}

export function PayBlock({ status, rows, reveal }: PayBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-1 pb-1.5 typo-caption-strong text-text-muted">급여</p>

      <div className="flex flex-col rounded-xl bg-surface px-4 py-1">
        {status === "failed" ? <FailedRow message="급여를 불러오지 못했어요" /> : null}
        {status === "empty" ? <EmptyRow message="아직 계산할 급여가 없어요" /> : null}
        {status === "filled" ? (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.kind}
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 py-3"
              >
                <AnchorIllustration name={illustrationOf(row.kind)} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate typo-caption text-text-muted">
                    {toPayRowLabel(row)}
                  </span>
                  {row.amount === null ? (
                    <span
                      className={cn(
                        "block typo-title tabular-nums",
                        row.kind === "this-month" ? "text-text-strong" : "text-text",
                      )}
                    >
                      —
                    </span>
                  ) : (
                    <MaskedAmount
                      value={row.amount}
                      masked={reveal.masked}
                      sweep={reveal.revealing}
                      format={formatWon}
                      onToggle={reveal.toggle}
                      onSweepEnd={reveal.settle}
                      className={cn(
                        "block typo-title",
                        row.kind === "this-month" ? "text-text-strong" : "text-text",
                      )}
                    />
                  )}
                </span>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-text-weak" />
              </div>
            ))}
          </div>
        ) : null}

        {status === "failed" ? null : (
          <Link
            href="/pay"
            transitionTypes={["tab"]}
            className="flex items-center justify-center gap-0.5 border-t border-border py-3 typo-body-sm text-text"
          >
            <span>주별로 모두 보기</span>
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
