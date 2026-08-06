import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { ADMIN_ROLES_PATH } from "@/shared/config/auth-routes.config";

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6">
      <h1 className="typo-display text-text-strong">관리자</h1>
      <ul className="flex flex-col">
        <li>
          <Link
            href={ADMIN_ROLES_PATH}
            className="flex items-center justify-between border-b border-border py-4 typo-body text-text-strong"
          >
            역할 관리
            <ChevronRight aria-hidden className="size-5 text-text" />
          </Link>
        </li>
      </ul>
    </main>
  );
}
