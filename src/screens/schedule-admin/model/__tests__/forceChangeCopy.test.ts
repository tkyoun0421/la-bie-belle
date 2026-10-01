// 구현 대상: src/screens/schedule-admin/model/forceChangeCopy.ts
//
// 확정 뒤 확인 시트 문안 넷이다 — 배정 추가·교육 붙이기·바꾸기·빼기(schedule-admin.md
// 「확정 뒤 문안」 표 그대로). 알림을 못 받는 사람이면 「…에게 알림이 가요」 대신 「…은
// 알림을 못 받아요 · 따로 연락해주세요」로 바뀐다(NTF-034). 바꾸기에서 한쪽만 못 받으면
// 그 사람 이름만 적고 받는 쪽은 안 적는다.

import { forceChangeCopy } from "@/screens/schedule-admin/model/forceChangeCopy";

describe("forceChangeCopy — 배정 추가 확인", () => {
  it("알림을 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "add",
      incomingName: "김지우",
      incomingCanNotify: true,
    });

    expect(copy.title).toBe("김지우 님을 넣을까요?");
    expect(copy.notice).toBe("김지우 님에게 알림이 가요");
    expect(copy.buttons).toEqual(["닫기", "넣기"]);
  });

  it("알림을 못 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "add",
      incomingName: "김지우",
      incomingCanNotify: false,
    });

    expect(copy.notice).toBe(
      "김지우 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });
});

describe("forceChangeCopy — 교육 붙이기 확인", () => {
  it("알림을 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "training",
      incomingName: "김지우",
      incomingCanNotify: true,
    });

    expect(copy.title).toBe("김지우 님을 교육으로 붙일까요?");
    expect(copy.notice).toBe("김지우 님에게 알림이 가요");
    expect(copy.buttons).toEqual(["닫기", "붙이기"]);
  });
});

describe("forceChangeCopy — 바꾸기 확인", () => {
  it("둘 다 알림을 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "swap",
      outgoingName: "박서연",
      outgoingCanNotify: true,
      incomingName: "김지우",
      incomingCanNotify: true,
    });

    expect(copy.title).toBe("박서연 님을 빼고 김지우 님을 넣을까요?");
    expect(copy.notice).toBe("두 사람에게 알림이 가요");
    expect(copy.buttons).toEqual(["닫기", "바꾸기"]);
  });

  it("빠지는 사람만 알림을 못 받으면 그 사람 이름만 적는다", () => {
    const copy = forceChangeCopy({
      kind: "swap",
      outgoingName: "박서연",
      outgoingCanNotify: false,
      incomingName: "김지우",
      incomingCanNotify: true,
    });

    expect(copy.notice).toBe(
      "박서연 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });

  it("들어오는 사람만 알림을 못 받으면 그 사람 이름만 적는다", () => {
    const copy = forceChangeCopy({
      kind: "swap",
      outgoingName: "박서연",
      outgoingCanNotify: true,
      incomingName: "김지우",
      incomingCanNotify: false,
    });

    expect(copy.notice).toBe(
      "김지우 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });
});

describe("forceChangeCopy — 빼기 확인", () => {
  it("알림을 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "remove",
      outgoingName: "박서연",
      outgoingCanNotify: true,
    });

    expect(copy.title).toBe("박서연 님을 뺄까요?");
    expect(copy.notice).toBe("박서연 님에게 알림이 가요 · 자리는 비어 남아요");
    expect(copy.buttons).toEqual(["닫기", "빼기"]);
  });

  it("알림을 못 받을 때", () => {
    const copy = forceChangeCopy({
      kind: "remove",
      outgoingName: "박서연",
      outgoingCanNotify: false,
    });

    expect(copy.notice).toBe(
      "박서연 님은 알림을 못 받아요 · 따로 연락해주세요",
    );
  });
});
