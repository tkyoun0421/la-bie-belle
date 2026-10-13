import {
  applicationsByDate,
  groupApplicationsByDate,
  groupApplicationsByPerson,
  spellApplicationDate,
  applicationsTitle,
  applicationsDeadlineLine,
  applicationsEmptyDeadlineLine,
} from "@/entities/availability/utils/applicationsGrouping.utils";

const ROWS = [
  { profileId: "profile-1", workDate: "2026-10-11", name: "박서연" },
  { profileId: "profile-2", workDate: "2026-10-10", name: "김지우" },
  { profileId: "profile-1", workDate: "2026-10-10", name: "박서연" },
];

describe("applicationsByDate — 날짜로 찾게 이름과 profileId를 같이 꽂는다", () => {
  it("같은 날짜의 이름과 profileId가 만난 순서로 모인다", () => {
    const byDate = applicationsByDate(ROWS);

    expect(byDate.get("2026-10-10")).toEqual({
      names: ["김지우", "박서연"],
      profileIds: ["profile-2", "profile-1"],
    });
    expect(byDate.get("2026-10-11")).toEqual({
      names: ["박서연"],
      profileIds: ["profile-1"],
    });
  });

  it("신청이 없으면 빈 Map이다", () => {
    expect(applicationsByDate([]).size).toBe(0);
  });
});

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

describe("spellApplicationDate — 신청 날짜를 요일과 함께 적는다", () => {
  it("월 일 요일 꼴이다", () => {
    expect(spellApplicationDate("2026-10-10")).toBe("10월 10일(토)");
  });
});

describe("applicationsTitle — 신청 화면 제목은 월을 든다", () => {
  it("앞 영을 떼고 월 근무 신청이라 적는다", () => {
    expect(applicationsTitle("2026-03")).toBe("3월 근무 신청");
  });
});

describe("applicationsDeadlineLine — 마감까지 남은 날을 한 줄로 적는다", () => {
  it("남은 날이 있으면 마감 날짜와 남은 일수를 적는다", () => {
    expect(
      applicationsDeadlineLine({
        applicationDeadline: "2026-10-10",
        now: "2026-10-07T03:00:00Z",
      }),
    ).toBe("마감 10월 10일(토) · 3일 남았어요");
  });

  it("마감 당일이면 오늘까지라고 적는다", () => {
    expect(
      applicationsDeadlineLine({
        applicationDeadline: "2026-10-10",
        now: "2026-10-10T03:00:00Z",
      }),
    ).toBe("마감 10월 10일(토) · 오늘까지예요");
  });

  it("마감이 지났으면 마감됐다고 적는다", () => {
    expect(
      applicationsDeadlineLine({
        applicationDeadline: "2026-10-10",
        now: "2026-10-11T03:00:00Z",
      }),
    ).toBe("10월 10일에 마감됐어요");
  });

  it("한국 날짜로 센다 — UTC로는 전날인 이른 아침도 한국 날짜다", () => {
    expect(
      applicationsDeadlineLine({
        applicationDeadline: "2026-10-10",
        now: "2026-10-09T16:00:00Z",
      }),
    ).toBe("마감 10월 10일(토) · 오늘까지예요");
  });
});

describe("applicationsEmptyDeadlineLine — 신청이 없을 때 마감일만 적는다", () => {
  it("월 일을 적는다", () => {
    expect(applicationsEmptyDeadlineLine("2026-10-05")).toBe(
      "마감은 10월 5일이에요",
    );
  });
});
