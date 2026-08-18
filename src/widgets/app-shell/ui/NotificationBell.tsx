import { Bell } from "lucide-react";
import Link from "next/link";

const NOTIFICATIONS_PATH = "/notifications";

type NotificationBellProps = {
  hasUnread: boolean;
};

export function NotificationBell({ hasUnread }: NotificationBellProps) {
  return (
    <Link
      href={NOTIFICATIONS_PATH}
      transitionTypes={["nav-forward"]}
      aria-label={hasUnread ? "읽지 않음. 알림" : "알림"}
      className="relative grid size-11 place-items-center text-text"
    >
      <Bell aria-hidden className="size-6" />
      {hasUnread ? (
        <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-pill bg-action" />
      ) : null}
    </Link>
  );
}
