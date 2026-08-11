import { Bell, CalendarDays, Home, Menu } from "lucide-react";
import type { ComponentType } from "react";

export type AppTabKey = "home" | "schedule" | "notifications" | "more";

export type AppTab = {
  key: AppTabKey;
  href: string;
  label: string;
  icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
};

export const APP_TABS: AppTab[] = [
  { key: "home", href: "/", label: "홈", icon: Home },
  { key: "schedule", href: "/schedule", label: "일정", icon: CalendarDays },
  { key: "notifications", href: "/notifications", label: "알림", icon: Bell },
  { key: "more", href: "/more", label: "전체", icon: Menu },
];
