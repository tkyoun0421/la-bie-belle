import {
  adminAttendanceLine,
  adminAttendanceShares,
} from "@/features/stats/utils/attendanceLine.utils";

const TALLY = { present: 41, late: 4, excused: 2, absent: 1 };

describe("adminAttendanceLine — 넷을 문서 표 순서로 적는다", () => {
  it("「출근 41 · 지각 4 · 출근 인정 2 · 결근 1」이다", () => {
    expect(adminAttendanceLine(TALLY)).toBe(
      "출근 41 · 지각 4 · 출근 인정 2 · 결근 1",
    );
  });

  it("0인 몫도 빠지지 않는다", () => {
    expect(
      adminAttendanceLine({ present: 3, late: 0, excused: 0, absent: 0 }),
    ).toBe("출근 3 · 지각 0 · 출근 인정 0 · 결근 0");
  });
});

describe("adminAttendanceShares — 순서가 곧 색이다", () => {
  it("출근·인정·지각·결근 순서로 넷이 선다", () => {
    expect(adminAttendanceShares(TALLY)).toEqual([
      { key: "present", label: "출근", value: 41 },
      { key: "excused", label: "인정", value: 2 },
      { key: "late", label: "지각", value: 4 },
      { key: "absent", label: "결근", value: 1 },
    ]);
  });

  it("0인 몫도 자리는 남긴다", () => {
    const shares = adminAttendanceShares({
      present: 3,
      late: 0,
      excused: 0,
      absent: 0,
    });

    expect(shares).toHaveLength(4);
    expect(shares[2].value).toBe(0);
  });
});
