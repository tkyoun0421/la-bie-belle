// 구현 대상: src/screens/applications/utils/applicationsGrouping.utils.ts
//
// 근무 신청 모아보기의 날짜순·사람순 재구성이다(schedule-admin.md 「근무 신청 모아보기
// 짜임」) — 날짜순은 날짜 머리 아래 이름, 사람순은 이름 아래 날짜들. 입력은
// `useMonthAvailabilitiesQuery`가 내는 `{ profile_id, work_date, profiles: { display_name } }`
// 행이다.

import {
  groupApplicationsByDate,
  groupApplicationsByPerson,
} from "@/screens/applications/utils/applicationsGrouping.utils";

const ROWS = [
  {
    profile_id: "profile-1",
    work_date: "2026-10-11",
    profiles: { display_name: "박서연" },
  },
  {
    profile_id: "profile-2",
    work_date: "2026-10-10",
    profiles: { display_name: "김지우" },
  },
  {
    profile_id: "profile-1",
    work_date: "2026-10-10",
    profiles: { display_name: "박서연" },
  },
];

describe("groupApplicationsByDate — 날짜마다 그날 신청한 사람 이름을 묶는다", () => {
  it("날짜 오름차순으로 서고 각 날짜에 신청자 이름이 모인다", () => {
    const groups = groupApplicationsByDate(ROWS);

    expect(groups.map((group) => group.workDate)).toEqual([
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(groups[0]!.names).toEqual(
      expect.arrayContaining(["김지우", "박서연"]),
    );
    expect(groups[0]!.names).toHaveLength(2);
    expect(groups[1]!.names).toEqual(["박서연"]);
  });

  it("신청이 없으면 빈 배열이다", () => {
    expect(groupApplicationsByDate([])).toEqual([]);
  });
});

describe("groupApplicationsByPerson — 사람마다 신청한 날짜들을 묶는다", () => {
  it("같은 사람의 날짜가 오름차순으로 모인다", () => {
    const groups = groupApplicationsByPerson(ROWS);

    const person1 = groups.find((group) => group.profileId === "profile-1");
    const person2 = groups.find((group) => group.profileId === "profile-2");

    expect(person1).toEqual({
      profileId: "profile-1",
      displayName: "박서연",
      workDates: ["2026-10-10", "2026-10-11"],
    });
    expect(person2).toEqual({
      profileId: "profile-2",
      displayName: "김지우",
      workDates: ["2026-10-10"],
    });
  });

  it("신청이 없으면 빈 배열이다", () => {
    expect(groupApplicationsByPerson([])).toEqual([]);
  });
});
