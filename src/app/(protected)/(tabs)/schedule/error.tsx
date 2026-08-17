"use client";

export default function ScheduleError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col items-center justify-center gap-4 p-6 pb-nav-safe text-center">
      <p className="typo-body text-text-muted">일정을 불러오지 못했어요</p>
      <button
        type="button"
        onClick={retry}
        className="rounded-pill border border-border px-4 py-2 typo-caption-strong text-text"
      >
        다시 시도
      </button>
    </main>
  );
}
