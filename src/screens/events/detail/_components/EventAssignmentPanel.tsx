"use client";

import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { Badge } from "#/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";
import type { EventDetail } from "#/entities/events/models/schemas/event";
import { assignmentErrors, assignmentErrorCodes } from "#/entities/assignments/models/errors/assignmentError";
import { useCreateAssignmentMutation } from "#/mutations/assignments/hooks/useCreateAssignmentMutation";
import { useEventApplicantsQuery } from "#/queries/assignments/hooks/useEventApplicantsQuery";
import { useEventAssignmentsQuery } from "#/queries/assignments/hooks/useEventAssignmentsQuery";

type EventAssignmentPanelProps = {
  eventId: string;
  positionSlots: EventDetail["positionSlots"];
};

function readAssignmentErrorMessage(error: unknown) {
  const code = assignmentErrors.read(error);

  switch (code) {
    case assignmentErrorCodes.createDuplicateActive:
      return "이 멤버는 이미 이 포지션에 배정되었습니다.";
    case assignmentErrorCodes.createEventNotFound:
      return "행사를 찾을 수 없습니다.";
    case assignmentErrorCodes.unauthorizedRole:
      return "배정 권한이 없습니다.";
    default:
      return "배정 중 오류가 발생했습니다.";
  }
}

export function EventAssignmentPanel({
  eventId,
  positionSlots,
}: Readonly<EventAssignmentPanelProps>) {
  const applicantsQuery = useEventApplicantsQuery(eventId);
  const assignmentsQuery = useEventAssignmentsQuery(eventId);
  const createMutation = useCreateAssignmentMutation();

  const applicants = applicantsQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];

  const assignmentError = createMutation.error
    ? readAssignmentErrorMessage(createMutation.error)
    : null;

  function handleAssign(positionId: string, userId: string) {
    if (!userId) {
      return;
    }

    createMutation.mutate({
      eventId,
      positionId,
      userId,
      assignmentKind: "regular",
    });
  }

  return (
    <Card className="border border-dashed border-border/70 bg-background/92">
      <CardHeader>
        <CardTitle>포지션 배정 관리</CardTitle>
        <CardDescription>
          행사에 신청한 멤버를 확인하고 포지션에 배정합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {assignmentError ? (
          <Alert variant="destructive">
            <AlertTitle>배정 실패</AlertTitle>
            <AlertDescription>{assignmentError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4">
          {positionSlots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
              이 행사는 포지션 슬롯이 없습니다.
            </div>
          ) : (
            positionSlots.map((slot) => {
              const slotAssignments = assignments.filter(
                (assignment) => assignment.positionId === slot.positionId
              );

              const activeApplicants = applicants.filter(() => {
                // 이미 해당 포지션에 배정된 사람은 드롭다운에서 제외할 수 있습니다 (또는 중복 배정 경고용으로 남겨둠).
                // 여기서는 UI 편의상 다른 곳에 배정되었든 아니든 신청자는 모두 보여줍니다.
                return true;
              });

              return (
                <div
                  key={slot.positionId}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {slot.positionName}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          필수 인원: {slot.requiredCount}명 (교육{" "}
                          {slot.trainingCount}명)
                        </span>
                        <Badge variant={slotAssignments.length >= slot.requiredCount ? "default" : "secondary"}>
                          {slotAssignments.length}명 배정됨
                        </Badge>
                      </div>
                    </div>

                    <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[200px]">
                      <Select
                        disabled={createMutation.isPending}
                        onValueChange={(userId) =>
                          handleAssign(slot.positionId, userId)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="멤버 선택하여 배정..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeApplicants.length === 0 ? (
                            <SelectItem disabled value="_empty">
                              신청자가 없습니다.
                            </SelectItem>
                          ) : (
                            activeApplicants.map((applicant) => (
                              <SelectItem
                                key={applicant.userId}
                                value={applicant.userId}
                              >
                                {applicant.userName} ({applicant.userEmail})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4">
                    {slotAssignments.length > 0 ? (
                      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {slotAssignments.map((assignment) => (
                          <li
                            key={assignment.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-foreground">
                              {assignment.userName}
                            </span>
                            <Badge className="ml-auto" variant="outline">
                              {assignment.status === "assigned"
                                ? "배정됨"
                                : assignment.status === "cancel_requested"
                                  ? "취소 요청"
                                  : assignment.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        아직 배정된 멤버가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
