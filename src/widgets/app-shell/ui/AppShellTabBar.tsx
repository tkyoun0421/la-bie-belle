"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_TABS, type AppTab } from "@/shared/config/app-tabs.config";
import { cn } from "@/shared/lib/cn";
import { resolveRouteTransition } from "@/shared/model/route-transition";

type AppShellTabBarProps = {
  hasUnreadNotifications: boolean;
};

function isTabActive(tab: AppTab, pathname: string) {
  if (tab.key === "more") {
    return pathname === "/more" || pathname === "/pay";
  }
  return pathname === tab.href;
}

export function AppShellTabBar({ hasUnreadNotifications }: AppShellTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      style={{ viewTransitionName: "persistent-nav" }}
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)]"
    >
      {APP_TABS.map((tab) => {
        const isActive = isTabActive(tab, pathname);
        const Icon = tab.icon;
        const transitionType = resolveRouteTransition(pathname, tab.href) ?? "tab";

        return (
          <Link
            key={tab.key}
            href={tab.href}
            transitionTypes={[transitionType]}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2 typo-caption",
              isActive ? "text-action" : "text-text",
            )}
          >
            <Icon aria-hidden className="size-6" />
            {tab.key === "notifications" && hasUnreadNotifications ? (
              <>
                <span className="sr-only">읽지 않음.</span>
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1/2 size-2 translate-x-3 rounded-pill bg-action"
                />
              </>
            ) : null}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
