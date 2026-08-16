"use client";

import { usePushPriming } from "@/features/push/hooks/usePushPriming";
import { usePushSubscription } from "@/features/push/hooks/usePushSubscription";
import { shouldShowPushPriming } from "@/features/push/model/push-priming";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";

const TITLE = "알림을 받아보세요";
const DESCRIPTION = "근무 확정과 변경 소식을 놓치지 않게 알려드려요.";
const ENABLE_LABEL = "알림 받기";
const LATER_LABEL = "나중에";
const IOS_INSTALL_GUIDE =
  "iPhone에서는 홈 화면에 추가한 뒤에 알림을 받을 수 있어요. 공유 버튼에서 홈 화면에 추가를 선택해 주세요.";

type PushPrimingSheetProps = { trigger: number };

export function PushPrimingSheet({ trigger }: PushPrimingSheetProps) {
  const subscription = usePushSubscription();
  const priming = usePushPriming();

  const hasSaved = trigger > 0;
  const open =
    hasSaved &&
    subscription.status !== "unsupported" &&
    shouldShowPushPriming({
      applicationSaved: true,
      subscribed: subscription.status === "subscribed",
      permissionDenied: subscription.status === "permission-denied",
      alreadyShown: priming.alreadyShown,
    });

  function close() {
    priming.markShown();
  }

  function handleEnable() {
    void subscription.subscribe().then(() => {
      close();
    });
  }

  const isIosNotInstalled = subscription.status === "ios-not-installed";

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
      title={TITLE}
      description={DESCRIPTION}
    >
      <div className="flex flex-col gap-4 pb-6">
        {isIosNotInstalled ? <p className="typo-body text-text">{IOS_INSTALL_GUIDE}</p> : null}
        <Button
          variant="primary"
          loading={subscription.pending}
          disabled={subscription.pending || isIosNotInstalled}
          onClick={handleEnable}
        >
          {ENABLE_LABEL}
        </Button>
        <Button variant="tertiary" onClick={close}>
          {LATER_LABEL}
        </Button>
      </div>
    </BottomSheet>
  );
}
