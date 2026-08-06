"use client";

import { formatDistance } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

import {
  groupNotificationsByRecency,
  type NotificationGroupKey,
} from "@/entities/notification/model/notification-group";
import type { NotificationItem } from "@/entities/notification/model/notification-item";
import { Button } from "@/shared/ui/button";
import { NotificationRow } from "@/shared/ui/notification-row";

const GROUP_LABEL: Record<NotificationGroupKey, string> = {
  today: "오늘",
  "this-week": "이번 주",
  earlier: "이전",
};

type NotificationsViewProps = {
  items: readonly NotificationItem[];
  now: Date;
  onNavigate: (item: NotificationItem) => void;
};

function relativeTime(occurredAt: string, now: Date) {
  return formatDistance(new Date(occurredAt), now, { locale: ko, addSuffix: true });
}

export function NotificationsView({
  items: initialItems,
  now,
  onNavigate,
}: NotificationsViewProps) {
  const [items, setItems] = useState<NotificationItem[]>(() => [...initialItems]);
  const hasUnread = items.some((item) => !item.read);
  const groups = groupNotificationsByRecency(items, now);

  function handleMarkAllRead() {
    setItems((previous) => previous.map((item) => ({ ...item, read: true })));
  }

  function handlePress(item: NotificationItem) {
    setItems((previous) =>
      previous.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
    );
    onNavigate(item);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-4 p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="typo-display text-text-strong">알림</h1>
        <Button variant="tertiary" onClick={handleMarkAllRead} disabled={!hasUnread}>
          모두 읽음
        </Button>
      </div>

      {items.length === 0 ? <p className="typo-body text-text">아직 알림이 없어요</p> : null}

      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <section key={group.key} className="flex flex-col gap-1">
            <h2 className="typo-label text-text">{GROUP_LABEL[group.key]}</h2>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  relativeTime={relativeTime(item.occurredAt, now)}
                  unread={!item.read}
                  onPress={() => handlePress(item)}
                />
              ))}
            </div>
          </section>
        ),
      )}
    </main>
  );
}
