import { hasIncomingRequest } from "@/entities/workRequest/model/incomingRequest.policy";

const MY_PROFILE_ID = "profile-1";

describe("hasIncomingRequest — 내 pending 갈래가 있는 요청이면 참이다", () => {
  it("내 profile_id가 pending 상태로 든 요청이 있으면 참이다", () => {
    const result = hasIncomingRequest(
      [
        {
          closedAt: null,
          candidates: [{ profileId: MY_PROFILE_ID, status: "pending" }],
        },
      ],
      MY_PROFILE_ID,
    );

    expect(result).toBe(true);
  });
});

describe("hasIncomingRequest — 내 갈래가 아니면 거짓이다", () => {
  it("다른 사람의 pending 갈래만 있으면 거짓이다", () => {
    const result = hasIncomingRequest(
      [
        {
          closedAt: null,
          candidates: [{ profileId: "profile-2", status: "pending" }],
        },
      ],
      MY_PROFILE_ID,
    );

    expect(result).toBe(false);
  });
});

describe("hasIncomingRequest — 내 갈래가 이미 답했으면 거짓이다", () => {
  it("내 갈래가 declined면 거짓이다", () => {
    const result = hasIncomingRequest(
      [
        {
          closedAt: null,
          candidates: [{ profileId: MY_PROFILE_ID, status: "declined" }],
        },
      ],
      MY_PROFILE_ID,
    );

    expect(result).toBe(false);
  });
});

describe("hasIncomingRequest — 요청이 닫혔으면 내 갈래가 pending이어도 거짓이다", () => {
  it("closed_at이 있으면 거짓이다", () => {
    const result = hasIncomingRequest(
      [
        {
          closedAt: "2026-10-10T00:00:00Z",
          candidates: [{ profileId: MY_PROFILE_ID, status: "pending" }],
        },
      ],
      MY_PROFILE_ID,
    );

    expect(result).toBe(false);
  });
});

describe("hasIncomingRequest — 그 날짜에 요청이 하나도 없으면 거짓이다", () => {
  it("빈 배열이면 거짓이다", () => {
    expect(hasIncomingRequest([], MY_PROFILE_ID)).toBe(false);
  });
});
