import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { RouteTransition } from "@/shared/ui/route-transition";
import {
  ADMIN_APPROVALS_PATH,
  ADMIN_POSITIONS_PATH,
  ADMIN_RECRUITMENT_PATH,
  ADMIN_ROLES_PATH,
  ADMIN_WORKERS_PATH,
} from "@/shared/config/auth-routes.config";

export default function AdminHomePage() {
  return (
    <RouteTransition>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6">
        <h1 className="typo-headline-md text-text-strong">관리자</h1>
        <ul className="flex flex-col">
          <li>
            <Link
              href={ADMIN_APPROVALS_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              가입 승인
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
          <li>
            <Link
              href={ADMIN_ROLES_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              역할 관리
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
          <li>
            <Link
              href={ADMIN_WORKERS_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              근무자 관리
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
          <li>
            <Link
              href={ADMIN_RECRUITMENT_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              모집 오픈
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
          <li>
            <Link
              href={ADMIN_POSITIONS_PATH}
              className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
            >
              포지션 관리
              <ChevronRight aria-hidden className="size-5 text-text" />
            </Link>
          </li>
        </ul>
      </main>
    </RouteTransition>
  );
}
