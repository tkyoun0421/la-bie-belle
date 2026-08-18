const SCREEN_TITLES: Record<string, string> = {
  "/": "홈",
  "/schedule": "일정",
  "/pay": "예상 급여",
  "/more": "전체",
  "/notifications": "알림",
  "/more/notification-settings": "알림 설정",
};

const FALLBACK_TITLE = "라비에벨";

export function resolveScreenTitle(pathname: string): string {
  return SCREEN_TITLES[pathname] ?? FALLBACK_TITLE;
}
