// 구현 대상: src/screens/membersPending/utils/formatSentAt.utils.ts
//
// 상세 시트가 보낸 시각을 그대로 말하는 줄이다. `MemberDetailSheet.tsx` 안에서 KST 보정
// 상수와 요일 표를 제 손으로 들고 조립하고 있었다 — 둘 다 공용 함수가 이미 한다.

import { formatSentAt } from "@/screens/membersPending/utils/formatSentAt.utils";

describe("formatSentAt — 목록과 달리 시트는 언제인지를 그대로 말한다", () => {
  it("「9월 9일(수) 21:04에 보냈어요」다", () => {
    expect(formatSentAt("2026-09-09T12:04:00.000Z")).toBe(
      "9월 9일(수) 21:04에 보냈어요",
    );
  });

  it("UTC로는 전날인 자정 뒤도 홀의 날짜로 적는다", () => {
    expect(formatSentAt("2026-09-09T16:30:00.000Z")).toBe(
      "9월 10일(목) 01:30에 보냈어요",
    );
  });
});
