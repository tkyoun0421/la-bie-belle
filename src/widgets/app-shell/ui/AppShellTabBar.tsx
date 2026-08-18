"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_TABS } from "@/shared/config/app-tabs.config";
import { cn } from "@/shared/lib/cn";
import { resolveRouteTransition } from "@/shared/model/route-transition";
import { useTabPressAnimation } from "@/widgets/app-shell/hooks/useTabPressAnimation";
import { TabIcon } from "@/widgets/app-shell/ui/TabIcon";

export function AppShellTabBar() {
  const pathname = usePathname();
  const { onTabPress, pressTokenFor } = useTabPressAnimation();

  return (
    <nav
      aria-label="주요 메뉴"
      style={{ viewTransitionName: "persistent-nav" }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="mx-auto flex min-h-16 max-w-screen-sm">
        {APP_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const transitionType = resolveRouteTransition(pathname, tab.href) ?? "tab";
          const pressToken = pressTokenFor(tab.key);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              transitionTypes={[transitionType]}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabPress(tab.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 typo-caption",
                isActive ? "font-semibold text-ink-800" : "text-text",
              )}
            >
              <TabIcon
                key={pressToken}
                name={tab.key}
                active={isActive}
                className={cn("size-6", pressToken !== 0 ? "motion-tab-press" : "")}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
