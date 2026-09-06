"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  askForNotificationPermission,
  INITIAL_NOTIFICATION_PROMPT_VIEW,
  type NotificationPromptView,
} from "@/screens/pending/model/notification-prompt";

const ROTATING_LINES = [
  "이번 달 근무표를 한눈에 봐요",
  "출근은 현장에서 찍어요",
  "일한 시간과 급여를 같이 봐요",
  "못 가는 날은 교대를 부탁해요",
];

const SURFACE_OF: Record<NotificationPromptView, string> = {
  idle: "bg-bg-neutral-weak",
  enabled: "bg-bg-positive-weak",
  unsupported: "bg-bg-informative-weak",
};

const APPEAR =
  "animate-in fade-in fill-mode-backwards ease-out animation-duration-[var(--duration-slower)] motion-safe:slide-in-from-bottom-4";

const BEAT =
  "motion-safe:animate-in motion-safe:zoom-in-90 motion-safe:repeat-infinite motion-safe:direction-alternate motion-safe:ease-out motion-safe:animation-duration-[calc(var(--interval-beat)/2)]";

const SWAP =
  "animate-in fade-in ease-out animation-duration-[var(--duration-base)]";

function millisecondsOf(cssTime: string): number {
  const amount = Number.parseFloat(cssTime);

  return cssTime.trimEnd().endsWith("ms") ? amount : amount * 1000;
}

function placeOf(index: number, showing: number): string {
  if (index === showing) {
    return "opacity-100 motion-safe:translate-y-0";
  }

  const justLeft =
    (showing + ROTATING_LINES.length - 1) % ROTATING_LINES.length;

  return index === justLeft
    ? "opacity-0 motion-safe:-translate-y-4"
    : "opacity-0 motion-safe:translate-y-4";
}

function RotatingLines() {
  const [showing, setShowing] = useState(0);

  useEffect(() => {
    const period = millisecondsOf(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--interval-rotate",
      ),
    );

    if (!Number.isFinite(period) || period <= 0) {
      return;
    }

    const timer = setInterval(
      () => setShowing((line) => (line + 1) % ROTATING_LINES.length),
      period,
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mt-2 min-h-[2lh] w-full text-center">
      {ROTATING_LINES.map((line, index) => (
        <p
          key={line}
          className={cn(
            "absolute inset-x-0 text-sm text-fg-neutral-muted transition-all duration-[var(--duration-slow)] ease-out",
            placeOf(index, showing),
          )}
        >
          {line}
        </p>
      ))}
    </div>
  );
}

function NotificationPrompt() {
  const [view, setView] = useState<NotificationPromptView>(
    INITIAL_NOTIFICATION_PROMPT_VIEW,
  );

  return (
    <section
      className={cn(
        "rounded-lg p-4 text-center transition-colors duration-[var(--duration-base)] ease-out",
        SURFACE_OF[view],
      )}
    >
      <div key={view} className={SWAP}>
        {view === "idle" && (
          <>
            <h2 className="text-sm font-semibold text-fg-neutral">
              승인되면 알려드릴까요?
            </h2>
            <p className="mt-2 text-xs text-fg-neutral-muted">
              알림을 켜두면 앱을 안 열어도 알 수 있어요
            </p>
            <Button
              className="mt-4 h-10 w-full"
              onClick={async () =>
                setView(await askForNotificationPermission(view))
              }
            >
              알림 켜기
            </Button>
          </>
        )}

        {view === "enabled" && (
          <>
            <div className="flex items-center justify-center gap-2">
              <Check className="size-4 animate-in text-fg-positive ease-out animation-duration-[var(--duration-base)] fade-in motion-safe:zoom-in-95" />
              <h2 className="text-sm font-semibold text-fg-neutral">
                승인되면 알려드릴게요
              </h2>
            </div>
            <p className="mt-2 text-xs text-fg-neutral-muted">
              알림은 설정에서 언제든 끌 수 있어요
            </p>
          </>
        )}

        {view === "unsupported" && (
          <>
            <h2 className="text-sm font-semibold text-fg-neutral">
              홈 화면에 추가하면 알림을 받아요
            </h2>
            <ol className="mt-2 list-inside list-decimal text-xs text-fg-neutral-muted">
              <li>아래 공유 버튼을 눌러요</li>
              <li>&quot;홈 화면에 추가&quot;를 골라요</li>
              <li>홈 화면에서 다시 열어요</li>
            </ol>
          </>
        )}
      </div>
    </section>
  );
}

export function PendingScreen({
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl: string | null;
}) {
  return (
    <main className="flex flex-1 flex-col items-center bg-bg-neutral px-6 pb-[calc(--spacing(6)+env(safe-area-inset-bottom))]">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <div
          className={cn(
            APPEAR,
            "flex h-8 items-center gap-2 rounded-full bg-bg-brand-weak px-3 text-xs font-medium text-fg-brand",
          )}
        >
          <span
            className={cn(BEAT, "size-1.5 rounded-full bg-bg-brand-solid")}
          />
          승인 기다리는 중
        </div>
        <h1
          className={cn(
            APPEAR,
            "mt-4 text-xl font-bold text-fg-neutral [--tw-animation-delay:calc(var(--stagger-step)*1)]",
          )}
        >
          관리자가 확인 중이에요
        </h1>
        <div
          className={cn(
            APPEAR,
            "w-full [--tw-animation-delay:calc(var(--stagger-step)*2)]",
          )}
        >
          <RotatingLines />
        </div>
      </div>

      <div
        className={cn(
          APPEAR,
          "w-full [--tw-animation-delay:calc(var(--stagger-step)*3)]",
        )}
      >
        <NotificationPrompt />
        <hr className="my-5 border-stroke-neutral" />
        <div className="flex items-center justify-center gap-3">
          <span
            className="size-8 shrink-0 rounded-full bg-bg-neutral-weak bg-cover bg-center"
            style={
              avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined
            }
          />
          <span className="text-sm text-fg-neutral-subtle">{email}</span>
        </div>
        <form action="/auth/logout" method="post" className="mt-4">
          <Button type="submit" variant="outline" className="h-12 w-full">
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  );
}
