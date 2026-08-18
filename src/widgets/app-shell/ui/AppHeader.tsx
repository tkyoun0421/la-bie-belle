"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { resolveScreenTitle } from "@/widgets/app-shell/model/screen-title";

const NOTIFICATIONS_PATH = "/notifications";

type AppHeaderProps = {
  hasUnreadNotifications: boolean;
  bannerSlot?: ReactNode;
};

type HeaderRowProps = {
  title: string;
  hasUnreadNotifications: boolean;
};

function HeaderRow({ title, hasUnreadNotifications }: HeaderRowProps) {
  return (
    <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
      <h1 className="typo-headline-md text-text-strong">{title}</h1>
      <Link
        href={NOTIFICATIONS_PATH}
        transitionTypes={["nav-forward"]}
        aria-label={hasUnreadNotifications ? "읽지 않음. 알림" : "알림"}
        className="relative grid size-11 place-items-center text-text"
      >
        <Bell aria-hidden className="size-6" />
        {hasUnreadNotifications ? (
          <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-pill bg-action" />
        ) : null}
      </Link>
    </div>
  );
}

export function AppHeader({ hasUnreadNotifications, bannerSlot }: AppHeaderProps) {
  const pathname = usePathname();
  const title = resolveScreenTitle(pathname);

  return (
    <>
      <div
        aria-hidden
        data-testid="app-header-spacer"
        className="invisible flex flex-col pt-[env(safe-area-inset-top)]"
      >
        <HeaderRow title={title} hasUnreadNotifications={hasUnreadNotifications} />
        {bannerSlot}
      </div>
      <div
        data-app-shell
        data-testid="app-header-shell"
        className="fixed inset-x-0 top-0 z-40 flex flex-col bg-canvas/50 pt-[env(safe-area-inset-top)] backdrop-blur-[9px]"
      >
        <HeaderRow title={title} hasUnreadNotifications={hasUnreadNotifications} />
        {bannerSlot}
      </div>
    </>
  );
}
