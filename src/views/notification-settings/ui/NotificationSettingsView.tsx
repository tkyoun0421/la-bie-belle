"use client";

import { usePushSubscription } from "@/features/push/hooks/usePushSubscription";
import type { PushSupportState } from "@/features/push/model/push-support";
import { Button } from "@/shared/ui/button";

const TITLE = "알림 설정";
const ENABLE_LABEL = "켜기";
const DISABLE_LABEL = "끄기";

const STATUS_DESCRIPTION: Record<PushSupportState, string> = {
  unsupported: "이 브라우저는 푸시 알림을 지원하지 않아요.",
  "ios-not-installed":
    "iPhone에서는 홈 화면에 추가한 뒤에 알림을 받을 수 있어요. 공유 버튼에서 홈 화면에 추가를 선택해 주세요.",
  "permission-denied":
    "브라우저 알림 권한이 꺼져 있어요. 브라우저 설정에서 알림을 허용한 뒤 다시 시도해 주세요.",
  ready: "이 기기에서 근무 확정과 변경 알림을 받아보세요.",
  subscribed: "이 기기에서 푸시 알림을 받고 있어요.",
};

export function NotificationSettingsView() {
  const subscription = usePushSubscription();

  function handleEnable() {
    void subscription.subscribe();
  }

  function handleDisable() {
    void subscription.unsubscribe();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <h1 className="px-1 typo-display text-text-strong">{TITLE}</h1>
      <section className="flex flex-col gap-4">
        <p className="typo-body text-text">{STATUS_DESCRIPTION[subscription.status]}</p>
        {subscription.status === "ready" ? (
          <Button
            variant="primary"
            loading={subscription.pending}
            disabled={subscription.pending}
            onClick={handleEnable}
          >
            {ENABLE_LABEL}
          </Button>
        ) : null}
        {subscription.status === "subscribed" ? (
          <Button
            variant="secondary"
            loading={subscription.pending}
            disabled={subscription.pending}
            onClick={handleDisable}
          >
            {DISABLE_LABEL}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
