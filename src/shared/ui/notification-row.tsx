import { cn } from "@/shared/lib/cn";

type NotificationRowProps = {
  title: string;
  body: string;
  relativeTime: string;
  unread: boolean;
  onPress: () => void;
  className?: string;
};

export function NotificationRow({
  title,
  body,
  relativeTime,
  unread,
  onPress,
  className,
}: NotificationRowProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex w-full items-start gap-2 border-b border-border py-3 text-left",
        className,
      )}
    >
      {unread ? <span className="sr-only">읽지 않음.</span> : null}
      {unread ? (
        <span aria-hidden className="mt-2 size-2 shrink-0 rounded-pill bg-action" />
      ) : (
        <span aria-hidden className="mt-2 size-2 shrink-0" />
      )}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className={cn(unread ? "typo-body-strong" : "typo-body", "text-text-strong")}>
          {title}
        </span>
        <span className="typo-caption text-text-muted">{body}</span>
      </div>
      <span className="typo-caption text-text">{relativeTime}</span>
    </button>
  );
}
