"use client";

import { useState } from "react";
import {
  applicationErrors,
  applicationErrorCodes,
} from "#/entities/applications/models/errors/applicationError";
import type {
  EventStatus,
} from "#/entities/events/models/schemas/event";
import { canWriteEventApplication } from "#/entities/events/models/policies/eventApplicationPolicy";
import { useApplyToEventMutation } from "#/mutations/applications/hooks/useApplyToEventMutation";
import { useCancelEventApplicationMutation } from "#/mutations/applications/hooks/useCancelEventApplicationMutation";
import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";

type EventApplicationPanelProps = {
  eventId: string;
  eventStatus: EventStatus;
  initialApplicationStatus: "applied" | "cancelled" | null;
};

function readApplicationStatusLabel(
  applicationStatus: "applied" | "cancelled" | null
) {
  if (applicationStatus === "applied") {
    return "신청됨";
  }

  if (applicationStatus === "cancelled") {
    return "취소됨";
  }

  return "미신청";
}

function readApplicationActionErrorMessage(error: unknown) {
  const code = applicationErrors.read(error);

  switch (code) {
    case applicationErrorCodes.applyClosedEvent:
    case applicationErrorCodes.cancelClosedEvent:
      return "지금은 신청 상태를 변경할 수 없는 행사입니다.";
    case applicationErrorCodes.applyEventNotFound:
    case applicationErrorCodes.cancelEventNotFound:
      return "행사를 찾을 수 없습니다. 목록을 새로고침해 주세요.";
    case applicationErrorCodes.cancelTargetMissing:
      return "취소할 신청 기록이 없습니다.";
    default:
      return "신청 상태를 변경할 수 없습니다.";
  }
}

export function EventApplicationPanel({
  eventId,
  eventStatus,
  initialApplicationStatus,
}: Readonly<EventApplicationPanelProps>) {
  const applyMutation = useApplyToEventMutation();
  const cancelMutation = useCancelEventApplicationMutation();
  const [applicationStatus, setApplicationStatus] = useState(
    initialApplicationStatus
  );
  const pending = applyMutation.isPending || cancelMutation.isPending;
  const writeError = applyMutation.error
    ? readApplicationActionErrorMessage(applyMutation.error)
    : cancelMutation.error
      ? readApplicationActionErrorMessage(cancelMutation.error)
      : null;
  const canWrite = canWriteEventApplication(eventStatus);

  async function toggleApplicationStatus() {
    if (!canWrite) {
      return;
    }

    if (applicationStatus === "applied") {
      await cancelMutation.mutateAsync(
        { eventId },
        {
          onSuccess(result) {
            setApplicationStatus(result.status);
          },
        }
      );
      return;
    }

    await applyMutation.mutateAsync(
      { eventId },
      {
        onSuccess(result) {
          setApplicationStatus(result.status);
        },
      }
    );
  }

  return (
    <Card className="border border-dashed border-border/70 bg-background/92">
      <CardHeader>
        <CardTitle>신청 상태</CardTitle>
        <CardDescription>
          대시보드 달력과 같은 신청 상태를 이 상세 화면에서도 확인하고 바로
          변경할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">내 상태</p>
            <Badge variant="outline">
              {readApplicationStatusLabel(applicationStatus)}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            현재 slice에서는 행사 단위로 신청하고 취소합니다. 포지션 배정은 다음
            slice에서 이어집니다.
          </p>
          {writeError ? (
            <Alert variant="destructive">
              <AlertTitle>신청 상태를 변경할 수 없습니다</AlertTitle>
              <AlertDescription>{writeError}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <Button
          disabled={pending || !canWrite}
          onClick={() => void toggleApplicationStatus()}
          size="sm"
          type="button"
        >
          {pending
            ? "처리 중..."
            : applicationStatus === "applied"
              ? "신청 취소"
              : canWrite
                ? "신청"
                : "모집 종료"}
        </Button>
      </CardContent>
    </Card>
  );
}
