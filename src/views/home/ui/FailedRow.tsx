"use client";

import { useRouter } from "next/navigation";

type FailedRowProps = {
  message: string;
};

export function FailedRow({ message }: FailedRowProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 py-3">
      <p className="flex-1 typo-body text-text">{message}</p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="h-8.5 shrink-0 rounded-pill bg-surface-weak px-3 typo-caption text-text-strong transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-out)] active:scale-[0.97]"
      >
        다시 시도
      </button>
    </div>
  );
}
