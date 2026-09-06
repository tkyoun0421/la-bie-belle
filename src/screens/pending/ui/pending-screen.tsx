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

function placeOf(index: number, showing: number): string {
  if (index === showing) {
    return "opacity-100 motion-safe:translate-y-0";
  }

  const justLeft =
    (showing + ROTATING_LINES.length - 1) % ROTATING_LINES.length;

  return index === justLeft
    ? "opacity-0 motion-safe:-translate-y-2"
    : "opacity-0 motion-safe:translate-y-2";
}

function RotatingLines() {
  const [showing, setShowing] = useState(0);

  useEffect(() => {
    const seconds = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--interval-rotate",
      ),
    );

    const timer = setInterval(
      () => setShowing((line) => (line + 1) % ROTATING_LINES.length),
      seconds * 1000,
    );

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mt-2 min-h-[2lh] w-full text-center">
      {ROTATING_LINES.map((line, index) => (
        <p
          key={line}
          className={cn(
            "absolute inset-x-0 text-sm text-fg-neutral-muted transition-all duration-240 ease-out",
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
        "rounded-lg p-4 text-center transition-colors duration-180",
        SURFACE_OF[view],
      )}
    >
      {view === "idle" && (
        <>
          <h2 className="text-sm font-semibold text-fg-neutral">
            승인되면 알려드릴까요?
          </h2>
          <p className="mt-2 text-xs text-fg-neutral-muted">
            알림을 켜두면 앱을 안 열어도 알 수 있어요
          </p>
          <Button
            className="mt-4 h-10 w-full duration-125 active:scale-[0.97]"
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
            <Check className="size-4 text-fg-positive" />
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
        <div className="flex h-8 items-center gap-2 rounded-full bg-bg-brand-weak px-3 text-xs font-medium text-fg-brand">
          <span className="size-1.5 rounded-full bg-bg-brand-solid motion-safe:animate-pulse" />
          승인 기다리는 중
        </div>
        <h1 className="mt-4 text-xl font-bold text-fg-neutral">
          관리자가 확인 중이에요
        </h1>
        <RotatingLines />
      </div>

      <div className="w-full">
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
          <Button
            type="submit"
            variant="outline"
            className="h-12 w-full duration-125 active:scale-[0.97]"
          >
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  );
}
