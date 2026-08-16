import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { hasRole, type RoleValue } from "@/entities/identity/model/role";
import type { SignOutOutcome } from "@/features/auth/hooks/useSignOutAction";
import { SignOutButton } from "@/features/auth/ui/SignOutButton";
import { ADMIN_PATH, MY_PROFILE_PATH } from "@/shared/config/auth-routes.config";

const NOTIFICATION_SETTINGS_PATH = "/more/notification-settings";

type MoreViewProps = {
  onSignOut: () => Promise<SignOutOutcome>;
  roles: RoleValue[];
};

export function MoreView({ onSignOut, roles }: MoreViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-3 p-4 pb-nav-safe">
      <h1 className="px-1 typo-display text-text-strong">전체</h1>
      <ul className="flex flex-col overflow-hidden rounded-xl bg-surface [&>li:last-child>a]:border-b-0">
        <li>
          <Link
            href="/pay"
            transitionTypes={["nav-forward"]}
            className="border-canvas flex items-center justify-between border-b px-4 py-4 typo-body text-text-strong"
          >
            예상 급여
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
        <li>
          <Link
            href={MY_PROFILE_PATH}
            transitionTypes={["nav-forward"]}
            className="border-canvas flex items-center justify-between border-b px-4 py-4 typo-body text-text-strong"
          >
            내 정보
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
        <li>
          <Link
            href={NOTIFICATION_SETTINGS_PATH}
            transitionTypes={["nav-forward"]}
            className="border-canvas flex items-center justify-between border-b px-4 py-4 typo-body text-text-strong"
          >
            알림 설정
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
        {hasRole(roles, "admin") ? (
          <li>
            <Link
              href={ADMIN_PATH}
              transitionTypes={["nav-forward"]}
              className="border-canvas flex items-center justify-between border-b px-4 py-4 typo-body text-text-strong"
            >
              관리자
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
        ) : null}
      </ul>
      <div className="px-1">
        <SignOutButton action={onSignOut} />
      </div>
    </main>
  );
}
