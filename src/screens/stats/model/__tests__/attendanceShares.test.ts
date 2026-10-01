// 구현 대상: src/screens/stats/model/attendanceShares.ts (아직 없다)
//
// attendanceRatioShares(tally) — 근태 탭 비율 띠의 몫 넷이다(plan stats-worker
// AC-01, spec AC-02). 순서는 출근→인정→지각→결근이고(stats.md 「근태 현황
// 줄」의 비율 띠 표) excused의 라벨은 "인정"이다 — 관리자 쪽(AdminStatsScreen.tsx의
// RatioBand shares)과 같은 순서·라벨이다. 몫이 0이어도 자리를 빼지 않는다 —
// 0을 감추는 것은 RatioBand·범례가 그릴 때 할 일이지 이 셈의 몫이 아니다.

import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendanceSummary";
import { attendanceRatioShares } from "@/screens/stats/model/attendanceShares";

const TALLY: MonthlyAttendanceTally = {
  present: 41,
  late: 4,
  absent: 1,
  excused: 2,
};

describe("attendanceRatioShares — 순서는 출근→인정→지각→결근이다(관리자 쪽과 같다)", () => {
  it("네 몫의 key 순서가 present, excused, late, absent다", () => {
    const shares = attendanceRatioShares(TALLY);

    expect(shares.map((share) => share.key)).toEqual([
      "present",
      "excused",
      "late",
      "absent",
    ]);
  });

  it("각 몫의 value가 tally의 그 값과 같다", () => {
    const shares = attendanceRatioShares(TALLY);

    expect(shares.map((share) => share.value)).toEqual([41, 2, 4, 1]);
  });
});

describe("attendanceRatioShares — excused의 라벨은 '출근 인정'이 아니라 '인정'이다(관리자 쪽과 같다)", () => {
  it("excused 몫의 label이 '인정'이다", () => {
    const shares = attendanceRatioShares(TALLY);
    const excused = shares.find((share) => share.key === "excused");

    expect(excused?.label).toBe("인정");
  });

  it("present·late·absent의 라벨은 '출근'·'지각'·'결근'이다", () => {
    const shares = attendanceRatioShares(TALLY);

    expect(shares.find((share) => share.key === "present")?.label).toBe("출근");
    expect(shares.find((share) => share.key === "late")?.label).toBe("지각");
    expect(shares.find((share) => share.key === "absent")?.label).toBe("결근");
  });
});

describe("attendanceRatioShares — 몫이 0이어도 자리 자체는 남는다", () => {
  it("넷이 다 0이어도 네 몫이 그대로 선다", () => {
    const shares = attendanceRatioShares({
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
    });

    expect(shares).toHaveLength(4);
    expect(shares.every((share) => share.value === 0)).toBe(true);
  });
});
