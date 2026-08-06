import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { hasRole, type RoleValue } from "@/entities/identity/model/role";
import type { SignOutOutcome } from "@/features/auth/hooks/useSignOutAction";
import { SignOutButton } from "@/features/auth/ui/SignOutButton";
import { ADMIN_PATH } from "@/shared/config/auth-routes.config";

type MoreViewProps = {
  onSignOut: () => Promise<SignOutOutcome>;
  roles: RoleValue[];
};

export function MoreView({ onSignOut, roles }: MoreViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-24">
      <h1 className="typo-display text-text-strong">전체</h1>
      <ul className="flex flex-col">
        <li>
          <Link
            href="/pay"
            className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
          >
            예상 급여
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
        {hasRole(roles, "admin") ? (
          <li>
            <Link
              href={ADMIN_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              관리자
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
        ) : null}
      </ul>
      <SignOutButton action={onSignOut} />
    </main>
  );
}
