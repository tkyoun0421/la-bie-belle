import {
  slotRequestBadge,
  slotRequestBadgeFor,
} from "@/screens/scheduleAdmin/model/slotRequestBadge.policy";

describe("slotRequestBadge — pending 후보 수를 「요청 n건 대기 중」으로 말한다", () => {
  it("살아 있는 요청에 pending 후보가 둘이면 「요청 2건 대기 중」이다", () => {
    const badge = slotRequestBadge({
      closedAt: null,
      candidates: [{ status: "pending" }, { status: "pending" }],
    });

    expect(badge).toBe("요청 2건 대기 중");
  });

  it("거절한 후보는 안 센다", () => {
    const badge = slotRequestBadge({
      closedAt: null,
      candidates: [{ status: "pending" }, { status: "declined" }],
    });

    expect(badge).toBe("요청 1건 대기 중");
  });
});

describe("slotRequestBadge — 닫힌 요청은 null이다", () => {
  it("closedAt이 있으면 pending 후보가 남아 있어도 null이다", () => {
    const badge = slotRequestBadge({
      closedAt: "2026-10-10T00:00:00Z",
      candidates: [{ status: "pending" }],
    });

    expect(badge).toBeNull();
  });
});

describe("slotRequestBadge — 요청 자체가 없으면 null이다", () => {
  it("null을 받으면 null을 낸다", () => {
    expect(slotRequestBadge(null)).toBeNull();
  });
});

describe("slotRequestBadgeFor — 그 자리의 요청만 본다", () => {
  const REQUESTS = [
    {
      slotId: "s1",
      closedAt: null,
      candidates: [{ status: "pending" }, { status: "declined" }],
    },
    {
      slotId: "s2",
      closedAt: "2026-10-10T00:00:00Z",
      candidates: [{ status: "pending" }],
    },
  ];

  it("내 자리에 살아 있는 요청이 있으면 배지가 선다", () => {
    expect(slotRequestBadgeFor("s1", REQUESTS)).toBe("요청 1건 대기 중");
  });

  it("내 자리의 요청이 닫혔으면 배지가 없다", () => {
    expect(slotRequestBadgeFor("s2", REQUESTS)).toBeNull();
  });

  it("내 자리에 요청이 없으면 배지가 없다", () => {
    expect(slotRequestBadgeFor("s3", REQUESTS)).toBeNull();
  });

  it("자리를 안 가리키는 요청은 안 센다", () => {
    expect(
      slotRequestBadgeFor("s1", [
        {
          slotId: null,
          closedAt: null,
          candidates: [{ status: "pending" }],
        },
      ]),
    ).toBeNull();
  });

  it("한 자리에 요청이 둘이면 마지막 것을 본다", () => {
    expect(
      slotRequestBadgeFor("s1", [
        ...REQUESTS,
        { slotId: "s1", closedAt: null, candidates: [] },
      ]),
    ).toBe("요청 0건 대기 중");
  });
});
