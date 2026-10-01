// 구현 대상: src/screens/stats/model/attendanceDays.ts (아직 없다)
//
// buildMyAttendanceDays(profileId, days, checkIns, excuseStatuses, now) — 근태
// 탭 날짜 목록의 재료다(plan stats-worker AC-01, spec AC-02). 판정은
// entities/attendance의 getAttendanceStatus 하나고 여기서 다시 안 짠다 —
// features/stats/model/attendanceInputs.ts의 buildAttendanceInputs로 재료를
// 맞물린 뒤 그 상태 함수에 그대로 넣는다(admin의 attendance-rows.ts
// buildAttendanceTab과 같은 전례다).
//
// - 내 배정이 있는 날만 남는다(ended_at이 null인 산 배정)
// - 인증 창이 아직 안 열려 getAttendanceStatus가 null을 내는 날은 목록에서
//   빠진다 — "아직 상태가 없다"는 여섯 상태 중 어디에도 속하지 않는다
// - 날짜순으로 정렬한다
// - 겸임 자리는 assignment.position이 이미 앞 포지션으로 해소돼 있어 그 값을
//   그대로 쓴다
// - 교육 배정(kind === 'training')은 isEducation이 true다
//
// myAttendanceRow(day) — 한 줄의 title·subtitle·value다.
// - title은 spellDate(workDate) — "10월 10일(토)"
// - subtitle은 isEducation이면 "포지션 교육", 아니면 포지션 이름 그대로다
// - value는 못 찍었으면(checkedAt === null) 상태 이름 하나, 찍었으면
//   "상태 · HH:mm"이다
// - 상태 이름 여섯은 "출근·지각·안 찍음·확인 중·인정·결근"이다 — 줄이지
//   않는다. schedule-worker의 "아직 안 찍음"·"출근 인정"이 아니다
//   (attendance/design.md가 정본).
//
// checkedTimeLabel(checkedAt) — ISO 순간을 KST HH:mm로 읽는다.

import type { AttendanceStatus } from "@/entities/attendance/model/attendanceStatus";
import type { ScheduleDay } from "@/entities/schedule/dals/getMonthSchedule";
import type {
  AttendanceInputCheckIn,
  AttendanceInputExcuseStatus,
} from "@/features/stats/model/attendanceInputs";
import {
  buildMyAttendanceDays,
  checkedTimeLabel,
  myAttendanceRow,
  type MyAttendanceDay,
} from "@/screens/stats/model/attendanceDays";

const ME = "p1";

function scheduleDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-x",
    work_date: "2026-09-10",
    starts_at: "10:00:00",
    ends_at: "19:00:00",
    opened_at: "2026-09-01T00:00:00.000Z",
    slots: [],
    check_ins: [],
    assignments: [
      {
        id: "a-x",
        slot_id: null,
        position: "메인",
        kind: "regular",
        profile_id: ME,
        ended_at: null,
        profiles: { display_name: "김지우" },
      },
    ],
    ...overrides,
  };
}

function assignment(
  position: string,
  kind: string,
  profileId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `a-${position}`,
    slot_id: null,
    position,
    kind,
    profile_id: profileId,
    ended_at: null,
    profiles: { display_name: "김지우" },
    ...overrides,
  };
}

// 출근·지각·결근·인정·확인 중·안 찍음 여섯을 하루씩 만든다. now를 하나로
// 고정해도(entities/attendance/model/__tests__/attendanceSummary.test.ts와
// 같은 시각 조합) 각 날의 사실만으로 상태가 갈린다.
const DAYS: ScheduleDay[] = [
  // 9/14 — 확인 중(사유 제출, 미결)
  scheduleDay({
    id: "day-14",
    work_date: "2026-09-14",
    assignments: [assignment("메인", "regular", ME)],
  }),
  // 9/10 — 출근, 교육 배정(안내)이라 subtitle이 "안내 교육"이어야 한다
  scheduleDay({
    id: "day-10",
    work_date: "2026-09-10",
    assignments: [assignment("안내", "training", ME)],
  }),
  // 9/11 — 지각
  scheduleDay({
    id: "day-11",
    work_date: "2026-09-11",
    assignments: [assignment("메인", "regular", ME)],
  }),
  // 9/12 — 결근(체크인 없음, 사유 없음, 마감 지남)
  scheduleDay({
    id: "day-12",
    work_date: "2026-09-12",
    assignments: [assignment("스캔", "regular", ME)],
  }),
  // 9/13 — 인정(사유 승인)
  scheduleDay({
    id: "day-13",
    work_date: "2026-09-13",
    assignments: [assignment("드레스실", "regular", ME)],
  }),
  // 9/15 — 안 찍음(체크인도 사유도 없고 마감 전)
  scheduleDay({
    id: "day-15",
    work_date: "2026-09-15",
    assignments: [assignment("메인", "regular", ME)],
  }),
  // 9/16 — 내 배정이 아니라 남의 날이다
  scheduleDay({
    id: "day-16",
    work_date: "2026-09-16",
    assignments: [assignment("스캔", "regular", "p2")],
  }),
  // 9/20 — 인증 창이 아직 안 열린 미래 날이다
  scheduleDay({
    id: "day-18",
    work_date: "2026-09-20",
    assignments: [assignment("메인", "regular", ME)],
  }),
];

const CHECK_INS: AttendanceInputCheckIn[] = [
  {
    day_id: "day-10",
    profile_id: ME,
    checked_at: "2026-09-10T01:00:00.000Z",
    reported_at: "2026-09-10T01:00:00.000Z",
    received_at: "2026-09-10T01:00:00.000Z",
  },
  {
    day_id: "day-11",
    profile_id: ME,
    checked_at: "2026-09-11T01:20:00.000Z",
    reported_at: "2026-09-11T01:20:00.000Z",
    received_at: "2026-09-11T01:20:00.000Z",
  },
];

const EXCUSE_STATUSES: AttendanceInputExcuseStatus[] = [
  {
    day_id: "day-13",
    profile_id: ME,
    submitted_at: "2026-09-13T10:00:00.000Z",
    decided_at: "2026-09-13T12:00:00.000Z",
    decision: "approved",
  },
  {
    day_id: "day-14",
    profile_id: ME,
    submitted_at: "2026-09-14T10:00:00.000Z",
    decided_at: null,
    decision: null,
  },
];

const NOW = "2026-09-15T12:00:00.000Z";

describe("buildMyAttendanceDays — 내 배정이 있는 날만 남고 남의 날은 안 든다", () => {
  it("9월 16일(p2의 날)은 목록에 없다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    expect(result.find((day) => day.workDate === "2026-09-16")).toBeUndefined();
  });
});

describe("buildMyAttendanceDays — 인증 창이 아직 안 열린 날은 목록에서 빠진다", () => {
  it("9월 20일은 여섯 상태 중 어디에도 안 들어 목록에서 빠진다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    expect(result.find((day) => day.workDate === "2026-09-20")).toBeUndefined();
  });
});

describe("buildMyAttendanceDays — 여섯 상태를 판정은 다시 안 짜고 getAttendanceStatus 그대로 쓴다", () => {
  it("날짜마다 상태가 출근·지각·결근·인정·확인 중·안 찍음으로 갈린다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    const byDate = new Map(result.map((day) => [day.workDate, day]));

    expect(byDate.get("2026-09-10")?.status).toBe("present");
    expect(byDate.get("2026-09-11")?.status).toBe("late");
    expect(byDate.get("2026-09-12")?.status).toBe("absent");
    expect(byDate.get("2026-09-13")?.status).toBe("excused");
    expect(byDate.get("2026-09-14")?.status).toBe("pending");
    expect(byDate.get("2026-09-15")?.status).toBe("unmarked");
  });

  it("여섯 날이 모두 남고 그 이상도 이하도 아니다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    expect(result).toHaveLength(6);
  });
});

describe("buildMyAttendanceDays — 날짜순으로 선다", () => {
  it("입력 순서가 뒤섞여 있어도 결과는 9/10~9/15 오름차순이다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    expect(result.map((day) => day.workDate)).toEqual([
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });
});

describe("buildMyAttendanceDays — 교육 배정은 isEducation이 true, 정규 배정은 false다", () => {
  it("9월 10일(안내 교육)은 isEducation이 true고 포지션은 '안내'다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );
    const training = result.find((day) => day.workDate === "2026-09-10");

    expect(training?.isEducation).toBe(true);
    expect(training?.position).toBe("안내");
  });

  it("9월 11일(정규 배정)은 isEducation이 false다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );
    const regular = result.find((day) => day.workDate === "2026-09-11");

    expect(regular?.isEducation).toBe(false);
  });
});

describe("buildMyAttendanceDays — 찍은 시각을 체크인 그대로 낸다", () => {
  it("9월 10일의 checkedAt이 체크인 행의 checked_at과 같다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );
    const present = result.find((day) => day.workDate === "2026-09-10");

    expect(present?.checkedAt).toBe("2026-09-10T01:00:00.000Z");
  });

  it("체크인이 없는 날(결근·인정·확인 중·안 찍음)은 checkedAt이 null이다", () => {
    const result = buildMyAttendanceDays(
      ME,
      DAYS,
      CHECK_INS,
      EXCUSE_STATUSES,
      NOW,
    );

    for (const date of [
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]) {
      expect(result.find((day) => day.workDate === date)?.checkedAt).toBeNull();
    }
  });
});

function attendanceDay(
  overrides: Partial<MyAttendanceDay> = {},
): MyAttendanceDay {
  return {
    workDate: "2026-10-10",
    position: "메인",
    isEducation: false,
    status: "present",
    checkedAt: "2026-10-10T00:52:00.000Z",
    ...overrides,
  };
}

describe("myAttendanceRow — 제목은 날짜와 요일이다(stats.md 「내 근태 날짜 목록」)", () => {
  it("2026-10-10은 '10월 10일(토)'다", () => {
    expect(myAttendanceRow(attendanceDay()).title).toBe("10월 10일(토)");
  });
});

describe("myAttendanceRow — 보조 정보는 포지션이고 교육이면 '포지션 교육' 꼴이다", () => {
  it("정규 배정은 포지션 이름 그대로다", () => {
    expect(
      myAttendanceRow(attendanceDay({ position: "메인", isEducation: false }))
        .subtitle,
    ).toBe("메인");
  });

  it("교육 배정은 '안내 교육'이다", () => {
    expect(
      myAttendanceRow(attendanceDay({ position: "안내", isEducation: true }))
        .subtitle,
    ).toBe("안내 교육");
  });
});

describe("myAttendanceRow — 오른쪽 값은 인증 상태와 찍은 시각이다. 못 찍었으면 상태만이다", () => {
  it("출근이고 찍은 시각이 있으면 '출근 · 09:52'다", () => {
    expect(
      myAttendanceRow(
        attendanceDay({
          status: "present",
          checkedAt: "2026-10-10T00:52:00.000Z",
        }),
      ).value,
    ).toBe("출근 · 09:52");
  });

  it("지각도 같은 꼴로 시각이 붙는다", () => {
    expect(
      myAttendanceRow(
        attendanceDay({
          status: "late",
          checkedAt: "2026-10-10T01:20:00.000Z",
        }),
      ).value,
    ).toBe("지각 · 10:20");
  });

  it("못 찍은 날은 상태만 선다 — '안 찍음'", () => {
    expect(
      myAttendanceRow(attendanceDay({ status: "unmarked", checkedAt: null }))
        .value,
    ).toBe("안 찍음");
  });

  it("확인 중은 '확인 중'이다 — 근무표 명단의 '확인 중'과 같은 글자다", () => {
    expect(
      myAttendanceRow(attendanceDay({ status: "pending", checkedAt: null }))
        .value,
    ).toBe("확인 중");
  });

  it("인정은 '인정'이다 — '출근 인정'으로 늘리지 않는다", () => {
    expect(
      myAttendanceRow(attendanceDay({ status: "excused", checkedAt: null }))
        .value,
    ).toBe("인정");
  });

  it("결근은 '결근'이다", () => {
    expect(
      myAttendanceRow(attendanceDay({ status: "absent", checkedAt: null }))
        .value,
    ).toBe("결근");
  });
});

const STATUSES: AttendanceStatus[] = [
  "present",
  "late",
  "unmarked",
  "pending",
  "excused",
  "absent",
];

describe("myAttendanceRow — 여섯 상태 이름을 줄이지 않는다", () => {
  it.each(STATUSES)("%s도 빈 문자열이 아닌 제 이름을 낸다", (status) => {
    const value = myAttendanceRow(
      attendanceDay({ status, checkedAt: null }),
    ).value;

    expect(value.length).toBeGreaterThan(0);
    expect(value).not.toBe("아직 안 찍음");
    expect(value).not.toContain("출근 인정");
  });
});

describe("checkedTimeLabel — ISO 순간을 KST HH:mm로 읽는다", () => {
  it("UTC 00:52는 KST 09:52다", () => {
    expect(checkedTimeLabel("2026-10-10T00:52:00.000Z")).toBe("09:52");
  });

  it("UTC 15:00은 다음 날 KST 자정을 건너 00:00이다", () => {
    expect(checkedTimeLabel("2026-10-10T15:00:00.000Z")).toBe("00:00");
  });
});
