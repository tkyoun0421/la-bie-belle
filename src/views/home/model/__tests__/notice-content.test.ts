import { describe, expect, it } from "vitest";

import { toNoticeContent } from "@/views/home/model/notice-content";

describe("toNoticeContent — 라운드 6~8, 알림 카드의 값·캡션은 model이 문장으로 조립한다", () => {
  it("공석·새 모집은 날짜와 함께 「지금 신청할 수 있어요」다", () => {
    const content = toNoticeContent({ id: "n1", kind: "vacancy", date: "2026-08-22" });

    expect(content).toEqual({ value: "8월 22일 공석", caption: "지금 신청할 수 있어요" });
  });

  it("스케줄 확정은 달 단위 값과 「포지션을 확인해보세요」다", () => {
    const content = toNoticeContent({ id: "n2", kind: "schedule-confirmed", month: "2026-08" });

    expect(content).toEqual({ value: "8월 스케줄 확정", caption: "포지션을 확인해보세요" });
  });

  it("확정 후 배정 변경은 날짜와 「이전 → 이후」 포지션이다", () => {
    const content = toNoticeContent({
      id: "n3",
      kind: "assignment-changed",
      date: "2026-08-21",
      fromPosition: "홀서빙",
      toPosition: "접수",
    });

    expect(content).toEqual({ value: "8월 21일 배정 변경", caption: "홀서빙 → 접수" });
  });

  it("변경 요청 승인은 「근무 취소」 사건 이름과 「요청이 반영됐어요」다 — 라운드 35 확정", () => {
    const content = toNoticeContent({ id: "n4", kind: "change-approved", date: "2026-08-24" });

    expect(content).toEqual({ value: "8월 24일 근무 취소", caption: "요청이 반영됐어요" });
  });

  it("변경 요청 미반영도 같은 사건 이름을 쓰고 캡션만 갈린다 — 라운드 35 확정", () => {
    const content = toNoticeContent({ id: "n5", kind: "change-rejected", date: "2026-08-24" });

    expect(content).toEqual({ value: "8월 24일 근무 취소", caption: "이번엔 반영되지 않았어요" });
  });

  it("승인·미반영은 값이 같다 — 결과는 그림 색과 캡션이 말하고 값은 사건만 말한다", () => {
    const approved = toNoticeContent({ id: "n4", kind: "change-approved", date: "2026-08-24" });
    const rejected = toNoticeContent({ id: "n5", kind: "change-rejected", date: "2026-08-24" });

    expect(approved.value).toBe(rejected.value);
    expect(approved.caption).not.toBe(rejected.caption);
  });

  it("변경 요청 미반영도 결과 통보이지 오류가 아니다 — 「실패」·「오류」라고 말하지 않는다", () => {
    const content = toNoticeContent({ id: "n5", kind: "change-rejected", date: "2026-08-24" });

    expect(content.caption).not.toContain("실패");
    expect(content.caption).not.toContain("오류");
    expect(content.value).not.toContain("실패");
    expect(content.value).not.toContain("오류");
  });

  it("월이 바뀌어도 날짜 문자열에서 그대로 뽑는다 — 9월 스케줄도 9월로 낸다", () => {
    const content = toNoticeContent({ id: "n6", kind: "schedule-confirmed", month: "2026-09" });

    expect(content.value).toBe("9월 스케줄 확정");
  });

  it("한 자리 날짜도 앞에 0을 안 붙인다", () => {
    const content = toNoticeContent({ id: "n7", kind: "vacancy", date: "2026-09-05" });

    expect(content.value).toBe("9월 5일 공석");
  });
});
