// 구현 대상: src/screens/schedule-admin/model/adjustSheetRows.ts
//
// 근무 조정 시트의 사람 줄 목록이다(payroll-adjust AC-03). 그날 살아 있는 배정만이고
// 교육 배정도 든다(PAY-007). 줄마다 그날 최종 시간이 서고, 조정이 든 줄은 「결근」·「연장」
// 앞머리가 붙는다. 리허설이 있는 사람은 이름 아래 작은 줄이 따로 선다(건수·시각 두 갈래).
// 리허설만 있고 배정이 없는 사람은 이 목록에 없다 — 이 시트는 그날 배정에서 출발한다.

import { adjustSheetRows } from "@/screens/schedule-admin/model/adjustSheetRows";

const DAY = { starts_at: "10:00", ends_at: "19:00" };

describe("adjustSheetRows — 조정이 없으면 배정 시간이 그대로 최종 시간이다", () => {
  it("앞머리 없이 540분이 선다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p1", name: "박서연", kind: "regular", ended_at: null },
      ],
      adjustments: [],
      rehearsals: [],
    });

    expect(rows).toEqual([
      {
        profile_id: "p1",
        name: "박서연",
        finalMinutes: 540,
        adjustmentKind: null,
        rehearsalLine: null,
      },
    ]);
  });
});

describe("adjustSheetRows — 마지막 조정이 음수면 결근 앞머리가 붙는다", () => {
  it("배정 540분에 -540분이 더해져 0분이 되고 앞머리가 결근이다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p2", name: "김지우", kind: "regular", ended_at: null },
      ],
      adjustments: [
        {
          profile_id: "p2",
          minutes: -540,
          adjusted_at: "2026-10-10T09:00:00Z",
        },
      ],
      rehearsals: [],
    });

    expect(rows[0]?.finalMinutes).toBe(0);
    expect(rows[0]?.adjustmentKind).toBe("결근");
  });
});

describe("adjustSheetRows — 마지막 조정이 양수면 연장 앞머리가 붙는다", () => {
  it("배정 540분에 120분이 더해져 660분이 되고 앞머리가 연장이다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p3", name: "이하늘", kind: "regular", ended_at: null },
      ],
      adjustments: [
        { profile_id: "p3", minutes: 120, adjusted_at: "2026-10-10T09:00:00Z" },
      ],
      rehearsals: [],
    });

    expect(rows[0]?.finalMinutes).toBe(660);
    expect(rows[0]?.adjustmentKind).toBe("연장");
  });
});

describe("adjustSheetRows — 마지막 조정 행이 0분이면 앞머리가 없다", () => {
  it("원래대로로 되돌린 사람은 최종 시간이 배정 시간이고 앞머리가 없다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p4", name: "최유진", kind: "regular", ended_at: null },
      ],
      adjustments: [
        {
          profile_id: "p4",
          minutes: -540,
          adjusted_at: "2026-10-10T09:00:00Z",
        },
        { profile_id: "p4", minutes: 0, adjusted_at: "2026-10-10T10:00:00Z" },
      ],
      rehearsals: [],
    });

    expect(rows[0]?.finalMinutes).toBe(540);
    expect(rows[0]?.adjustmentKind).toBeNull();
  });
});

describe("adjustSheetRows — ended_at이 찬 배정은 목록에서 빠진다", () => {
  it("취소되거나 교대로 넘어간 배정은 안 선다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        {
          profile_id: "p5",
          name: "박서연",
          kind: "regular",
          ended_at: "2026-10-10T08:00:00Z",
        },
      ],
      adjustments: [],
      rehearsals: [],
    });

    expect(rows).toEqual([]);
  });
});

describe("adjustSheetRows — kind가 training인 배정도 든다", () => {
  it("교육 배정 줄도 목록에 선다(PAY-007)", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        {
          profile_id: "p6",
          name: "김지우",
          kind: "training",
          ended_at: null,
        },
      ],
      adjustments: [],
      rehearsals: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.profile_id).toBe("p6");
  });
});

describe("adjustSheetRows — 리허설만 있고 배정이 없는 사람은 목록에 없다", () => {
  it("배정이 없으면 그 사람의 리허설 행이 있어도 줄이 안 선다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [],
      adjustments: [],
      rehearsals: [
        { profile_id: "p7", starts_at: null, ends_at: null, count: 2 },
      ],
    });

    expect(rows).toEqual([]);
  });
});

describe("adjustSheetRows — 배정이 0명이면 빈 배열이다", () => {
  it("아무것도 없으면 빈 배열이다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [],
      adjustments: [],
      rehearsals: [],
    });

    expect(rows).toEqual([]);
  });
});

describe("adjustSheetRows — 리허설 줄 문구, 건수 갈래", () => {
  it("건수로 넣은 리허설은 「리허설 2건 · 2시간」이다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p8", name: "이하늘", kind: "regular", ended_at: null },
      ],
      adjustments: [],
      rehearsals: [
        { profile_id: "p8", starts_at: null, ends_at: null, count: 2 },
      ],
    });

    expect(rows[0]?.rehearsalLine).toBe("리허설 2건 · 2시간");
  });
});

describe("adjustSheetRows — 리허설 줄 문구, 시각 갈래", () => {
  it("시각으로 넣은 리허설은 「리허설 14:00–16:00 · 2시간」이고 초를 뗀다", () => {
    const rows = adjustSheetRows({
      day: DAY,
      assignments: [
        { profile_id: "p9", name: "최유진", kind: "regular", ended_at: null },
      ],
      adjustments: [],
      rehearsals: [
        {
          profile_id: "p9",
          starts_at: "14:00:00",
          ends_at: "16:00:00",
          count: null,
        },
      ],
    });

    expect(rows[0]?.rehearsalLine).toBe("리허설 14:00–16:00 · 2시간");
  });
});
