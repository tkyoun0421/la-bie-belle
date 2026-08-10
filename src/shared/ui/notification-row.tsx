import { useRef, type CSSProperties } from "react";

import { useSwipeAction } from "@/shared/hooks/useSwipeAction";
import { cn } from "@/shared/lib/cn";

type NotificationRowProps = {
  title: string;
  body: string;
  relativeTime: string;
  unread: boolean;
  onPress: () => void;
  onSwipeRead?: () => void;
  className?: string;
  style?: CSSProperties;
};

export function NotificationRow({
  title,
  body,
  relativeTime,
  unread,
  onPress,
  onSwipeRead,
  className,
  style,
}: NotificationRowProps) {
  const suppressClickRef = useRef(false);
  const { offset, handlers } = useSwipeAction({
    onCommit:
      onSwipeRead === undefined
        ? undefined
        : () => {
            suppressClickRef.current = true;
            onSwipeRead();
          },
  });

  function handleClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onPress();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      {...handlers}
      style={{ ...style, transform: `translateX(${offset}px)` }}
      className={cn(
        "flex w-full items-start gap-2 border-b border-border py-3 text-left transition-transform duration-[var(--duration-feedback)] ease-[var(--ease-spring)]",
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
