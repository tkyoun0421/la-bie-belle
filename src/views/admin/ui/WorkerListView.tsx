import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { PROFILE_STATUS_VALUES, type ProfileStatus } from "@/entities/identity/model/profile-gate";
import type { WorkerListItem } from "@/entities/identity/types/worker";
import { ADMIN_WORKERS_PATH } from "@/shared/config/auth-routes.config";
import { cn } from "@/shared/lib/cn";
import { profileStatusLabel } from "@/views/admin/model/profile-status-label";

type WorkerListViewProps = {
  workers: WorkerListItem[];
  search: string;
  status: ProfileStatus;
};

function statusHref(targetStatus: ProfileStatus, search: string): string {
  const params = new URLSearchParams();
  params.set("status", targetStatus);
  if (search.length > 0) {
    params.set("q", search);
  }
  return `${ADMIN_WORKERS_PATH}?${params.toString()}`;
}

export function WorkerListView({ workers, search, status }: WorkerListViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-nav-safe">
      <h1 className="typo-headline-md text-text-strong">근무자 관리</h1>
      <form method="get" action={ADMIN_WORKERS_PATH} className="flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="이름 검색"
          aria-label="이름 검색"
          className="h-11 flex-1 rounded-md border border-border bg-surface-weak px-4 typo-body text-text-strong"
        />
      </form>
      <div className="flex gap-2 overflow-x-auto">
        {PROFILE_STATUS_VALUES.map((value) => (
          <Link
            key={value}
            href={statusHref(value, search)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-pill border px-3 typo-label whitespace-nowrap",
              value === status
                ? "border-action-border bg-action-surface text-action"
                : "border-border bg-surface text-text",
            )}
          >
            {profileStatusLabel(value)}
          </Link>
        ))}
      </div>
      {workers.length === 0 ? (
        <p className="typo-body text-text">조건에 맞는 근무자가 없어요</p>
      ) : (
        <ul className="flex flex-col">
          {workers.map((worker) => (
            <li key={worker.id}>
              <Link
                href={`${ADMIN_WORKERS_PATH}/${worker.id}`}
                className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
              >
                {worker.name}
                <ChevronRight aria-hidden className="size-5 text-text" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
