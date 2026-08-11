import { APP_TABS } from "@/shared/config/app-tabs.config";

export type RouteTransitionKind = "tab" | "nav-forward" | "nav-back" | null;

function isTabPath(pathname: string): boolean {
  return APP_TABS.some((tab) => tab.href === pathname);
}

export function resolveRouteTransition(from: string, to: string): RouteTransitionKind {
  const fromIsTab = isTabPath(from);
  const toIsTab = isTabPath(to);

  if (fromIsTab && toIsTab) {
    return "tab";
  }
  if (fromIsTab && !toIsTab) {
    return "nav-forward";
  }
  if (!fromIsTab && toIsTab) {
    return "nav-back";
  }
  return null;
}
