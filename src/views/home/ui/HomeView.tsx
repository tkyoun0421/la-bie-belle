import Link from "next/link";

import type {
  AttendanceAction,
  AttendanceFailureReason,
  AttendanceStatus,
} from "@/entities/attendance/model/attendance-status";
import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";
import { Button } from "@/shared/ui/button";

export type HomeViewModel =
  | {
      priority: "attendance";
      attendanceStatus: AttendanceStatus;
      shiftDate: string;
      position: string;
    }
  | { priority: "deadline-application"; date: string; applicationDeadline: string }
  | { priority: "confirmation-change"; confirmation: ScheduleConfirmation }
  | { priority: "next-shift"; date: string; position: string }
  | { priority: "empty" };

const ATTENDANCE_ACTION_LABEL: Record<AttendanceAction, string> = {
  "check-in": "출근 인증하기",
  "check-out": "퇴근 인증하기",
};

const ATTENDANCE_FAILURE_MESSAGE: Record<AttendanceFailureReason, string> = {
  "permission-denied": "위치 권한이 꺼져 있어요",
  "low-accuracy": "위치 정확도가 낮아요",
  "out-of-range": "근무지 범위 밖이에요",
};

function AttendanceSection({
  attendanceStatus,
  shiftDate,
  position,
}: {
  attendanceStatus: AttendanceStatus;
  shiftDate: string;
  position: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="typo-caption text-text">
        {shiftDate} · {position} 근무
      </p>
      {attendanceStatus.type === "ready" ? (
        <Button variant="primary">{ATTENDANCE_ACTION_LABEL[attendanceStatus.action]}</Button>
      ) : null}
      {attendanceStatus.type === "checking" ? (
        <p className="typo-body text-text-strong">현재 위치를 확인하고 있어요</p>
      ) : null}
      {attendanceStatus.type === "success" ? (
        <p className="typo-body text-text-strong">현장 위치가 확인됐어요</p>
      ) : null}
      {attendanceStatus.type === "failure" ? (
        <div className="flex flex-col gap-3">
          <p className="typo-body text-danger">
            {ATTENDANCE_FAILURE_MESSAGE[attendanceStatus.reason]}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary">권한 설정하기</Button>
            <Button variant="tertiary">QR로 인증하기</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function HomeView({ model }: { model: HomeViewModel }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <h1 className="typo-display text-text-strong">홈</h1>

      {model.priority === "attendance" ? (
        <AttendanceSection
          attendanceStatus={model.attendanceStatus}
          shiftDate={model.shiftDate}
          position={model.position}
        />
      ) : null}

      {model.priority === "deadline-application" ? (
        <section className="flex flex-col gap-3">
          <p className="typo-title text-text-strong">근무 신청 마감이 임박했어요</p>
          <p className="typo-body text-text">
            {model.date} · {model.applicationDeadline}까지
          </p>
          <Button asChild variant="primary">
            <Link href="/schedule">지금 신청하기</Link>
          </Button>
        </section>
      ) : null}

      {model.priority === "confirmation-change" ? (
        <section className="flex flex-col gap-3">
          <p className="typo-title text-text-strong">확정 스케줄이 변경됐어요</p>
          <p className="typo-body text-action">{model.confirmation.changeSummary}</p>
          <Button asChild variant="primary">
            <Link href={`/schedule/${model.confirmation.date}`}>확인하기</Link>
          </Button>
        </section>
      ) : null}

      {model.priority === "next-shift" ? (
        <section className="flex flex-col gap-3">
          <p className="typo-title text-text-strong">다음 근무</p>
          <p className="typo-body text-text">
            {model.date} · {model.position}
          </p>
          <Button asChild variant="secondary">
            <Link href={`/schedule/${model.date}`}>상세 보기</Link>
          </Button>
        </section>
      ) : null}

      {model.priority === "empty" ? (
        <section className="flex flex-col gap-2">
          <p className="typo-title text-text-strong">아직 할 일이 없어요</p>
          <p className="typo-body text-text">일정에서 근무 가능일을 신청해보세요</p>
        </section>
      ) : null}
    </main>
  );
}
