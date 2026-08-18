export type AppTabKey = "home" | "schedule" | "pay" | "more";

export type AppTab = {
  key: AppTabKey;
  href: string;
  label: string;
};

export const APP_TABS: AppTab[] = [
  { key: "home", href: "/", label: "홈" },
  { key: "schedule", href: "/schedule", label: "일정" },
  { key: "pay", href: "/pay", label: "급여" },
  { key: "more", href: "/more", label: "전체" },
];
