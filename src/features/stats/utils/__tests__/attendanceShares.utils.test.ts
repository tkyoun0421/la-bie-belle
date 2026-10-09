import type { MonthlyAttendanceTally } from "@/entities/attendance/model/attendance.type";
import { attendanceRatioShares } from "@/features/stats/utils/attendanceShares.utils";

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
