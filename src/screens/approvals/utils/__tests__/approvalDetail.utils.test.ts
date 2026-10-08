import { cancelApprovalDetail } from "@/screens/approvals/utils/approvalDetail.utils";

const INPUT = {
  displayName: "이준호",
  workDate: "2026-10-12",
  position: "메인",
  startsAt: "10:00:00",
  endsAt: "19:00:00",
  sentAt: "2026-10-07T10:40:00Z",
  reason: "그날 대신 나올 사람을 못 구했어요",
};

describe("cancelApprovalDetail — 제목이 사람·날짜·요일·포지션이다", () => {
  it("「이준호 · 10월 12일(월) 메인」이다", () => {
    const view = cancelApprovalDetail(INPUT);

    expect(view.title).toBe("이준호 · 10월 12일(월) 메인");
  });
});

describe("cancelApprovalDetail — 부제가 그날 근무 시간이다", () => {
  it("「10:00–19:00」이다 — 공백 없는 표기다", () => {
    const view = cancelApprovalDetail(INPUT);

    expect(view.subtitle).toBe("10:00–19:00");
  });
});

describe("cancelApprovalDetail — 보낸 시각 줄이 KST로 선다", () => {
  it("UTC 10:40은 KST 19:40이라 「10월 7일 19:40에 보냈어요」다", () => {
    const view = cancelApprovalDetail(INPUT);

    expect(view.sentAtLine).toBe("10월 7일 19:40에 보냈어요");
  });
});

describe("cancelApprovalDetail — 사유는 받은 글 그대로다", () => {
  it("고치거나 자르지 않는다", () => {
    const view = cancelApprovalDetail(INPUT);

    expect(view.reason).toBe("그날 대신 나올 사람을 못 구했어요");
  });
});
