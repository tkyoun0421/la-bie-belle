import type { NoticeItem } from "@/views/home/model/home-view-model";

function monthOf(isoDateOrMonth: string): number {
  const [, month] = isoDateOrMonth.split("-");
  return Number(month);
}

function dayOf(isoDate: string): number {
  const [, , day] = isoDate.split("-");
  return Number(day);
}

export function toNoticeContent(notice: NoticeItem): { value: string; caption: string } {
  switch (notice.kind) {
    case "vacancy":
      return {
        value: `${monthOf(notice.date)}월 ${dayOf(notice.date)}일 공석`,
        caption: "지금 신청할 수 있어요",
      };
    case "schedule-confirmed":
      return {
        value: `${monthOf(notice.month)}월 스케줄 확정`,
        caption: "포지션을 확인해보세요",
      };
    case "assignment-changed":
      return {
        value: `${monthOf(notice.date)}월 ${dayOf(notice.date)}일 배정 변경`,
        caption: `${notice.fromPosition} → ${notice.toPosition}`,
      };
    case "change-approved":
      return {
        value: `${monthOf(notice.date)}월 ${dayOf(notice.date)}일 근무 취소`,
        caption: "요청이 반영됐어요",
      };
    case "change-rejected":
      return {
        value: `${monthOf(notice.date)}월 ${dayOf(notice.date)}일 근무 취소`,
        caption: "이번엔 반영되지 않았어요",
      };
  }
}
