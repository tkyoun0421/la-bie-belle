// 구현 대상: src/screens/admin-stats/model/attendance-rows.ts
//
// buildAttendanceRows(people) — 근태 탭 사람별 목록을 조립한다(plan·spec
// stats-admin AC-09, stats.md「근태 사람별 목록」). AttendanceRowInput은
// { profileId, displayName, present, late, absent, excused }다.
//
// - 이름 가나다순이다 — 근무 탭 사람별 구획(시간 많은 순)과 반대다
// - 지각이 0이면 그 자리가 빈다: late가 0이면 결과의 late는 null이다 — 「지각
//   0」을 안 적는다는 뜻을 화면이 렌더할 수 있게 값 자체를 비운다
// - 출근(present)은 지각과 달리 0이어도 그 값 그대로다 — 출근은 항상 서는
//   기본 값이라서다. absent·excused의 0-처리는 이 task가 배정받은 범위 밖이라
//   여기서 단언하지 않는다(아래 「못 쓴 것」 참고)

import { buildAttendanceRows } from "@/screens/admin-stats/model/attendance-rows";

describe("buildAttendanceRows — 이름 가나다순이다(근무 탭과 반대)", () => {
  it("입력 순서와 무관하게 김지우·박서연·최윤아 순으로 선다", () => {
    const rows = buildAttendanceRows([
      {
        profileId: "p4",
        displayName: "최윤아",
        present: 10,
        late: 0,
        absent: 0,
        excused: 0,
      },
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 1,
        absent: 0,
        excused: 0,
      },
      {
        profileId: "p2",
        displayName: "박서연",
        present: 11,
        late: 0,
        absent: 1,
        excused: 0,
      },
    ]);

    expect(rows.map((row) => row.displayName)).toEqual([
      "김지우",
      "박서연",
      "최윤아",
    ]);
  });
});

describe("buildAttendanceRows — 지각이 0이면 그 자리가 빈다", () => {
  it("late가 0인 사람은 결과의 late가 null이다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 0,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.late).toBeNull();
  });

  it("late가 1 이상인 사람은 그 수가 그대로 남는다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 12,
        late: 3,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.late).toBe(3);
  });
});

describe("buildAttendanceRows — 출근은 0이어도 그 값 그대로 남는다", () => {
  it("present는 지각과 달리 0을 null로 바꾸지 않는다", () => {
    const [row] = buildAttendanceRows([
      {
        profileId: "p1",
        displayName: "김지우",
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      },
    ]);

    expect(row.present).toBe(0);
  });
});

describe("buildAttendanceRows — 입력이 비어 있으면 빈 목록이다", () => {
  it("사람이 없으면 빈 배열이다", () => {
    expect(buildAttendanceRows([])).toEqual([]);
  });
});
