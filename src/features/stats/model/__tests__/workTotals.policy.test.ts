// 구현 대상: src/features/stats/model/workTotals.policy.ts
//
// computeWorkTotals(assignments, days) — 그달의 배정 목록과 날 목록을 받아
// { totalMinutes, totalCount, byPerson, byPosition }을 낸다
// (plan stats-admin AC-01, spec stats-admin AC-01).
//
// WorkAssignment = { id, day_id, profile_id, display_name, position, kind,
// ended_at }. WorkDay = { id, work_date, starts_at, ends_at }.
// 한 배정의 시간은 그 배정이 든 날의 starts_at~ends_at 차이다.
//
// - ended_at이 찬 배정은 셈에서 빠진다
// - kind가 'training'인 배정도 든다 — 어느 포지션의 교육이었는지로 센다(ATT-020)
// - 겸임(포지션 둘을 합친 자리)의 배정은 position 필드 하나만 갖고 있고 그 값(앞
//   포지션)으로만 세진다 — 뒤 포지션 쪽에는 아무것도 안 붙는다
// - byPosition은 POSITION_ORDER 아홉이 항상 다 서고, 배정이 없는 포지션은
//   { minutes: 0, count: 0 }이다
// - byPerson 시간 합, byPosition 시간 합, totalMinutes 셋이 같다(count도 같다)
// - 재직 여부는 이 함수의 입력에 없다 — 그달 배정이 있으면 무조건 byPerson에 선다
//   (퇴사한 사람도 같다)

import type { ScheduleDay } from "@/entities/schedule/api/schedule.dto";
import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import { ASSIGNMENTS, DAYS } from "@/features/stats/model/__tests__/fixtures";
import {
  computeWorkTotals,
  dayMinutes,
  hoursLabel,
  isLiveAssignment,
  workInputsOf,
  type WorkAssignment,
  type WorkDay,
} from "@/features/stats/model/workTotals.policy";

describe("computeWorkTotals — 사람별 합·포지션별 합·전체 합이 같다", () => {
  it("byPerson 시간 합과 byPosition 시간 합이 totalMinutes와 같다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const personSum = totals.byPerson.reduce(
      (sum, row) => sum + row.minutes,
      0,
    );
    const positionSum = totals.byPosition.reduce(
      (sum, row) => sum + row.minutes,
      0,
    );

    expect(personSum).toBe(totals.totalMinutes);
    expect(positionSum).toBe(totals.totalMinutes);
    expect(totals.totalMinutes).toBe(1800);
  });

  it("byPerson 건수 합과 byPosition 건수 합이 totalCount와 같다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const personCount = totals.byPerson.reduce(
      (sum, row) => sum + row.count,
      0,
    );
    const positionCount = totals.byPosition.reduce(
      (sum, row) => sum + row.count,
      0,
    );

    expect(personCount).toBe(totals.totalCount);
    expect(positionCount).toBe(totals.totalCount);
    expect(totals.totalCount).toBe(4);
  });
});

describe("computeWorkTotals — 겸임은 앞 포지션으로 한 번만 센다", () => {
  it("드레스실에 480분이 서고 대기실은 0분이다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const dressRoom = totals.byPosition.find(
      (row) => row.position === "드레스실",
    );
    const waitingRoom = totals.byPosition.find(
      (row) => row.position === "대기실",
    );

    expect(dressRoom?.minutes).toBe(480);
    expect(dressRoom?.count).toBe(1);
    expect(waitingRoom?.minutes).toBe(0);
    expect(waitingRoom?.count).toBe(0);
  });
});

describe("computeWorkTotals — 교육 배정도 그 포지션의 시간으로 든다", () => {
  it("안내 포지션에 교육 배정 360분이 선다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const guide = totals.byPosition.find((row) => row.position === "안내");

    expect(guide?.minutes).toBe(360);
    expect(guide?.count).toBe(1);
  });
});

describe("computeWorkTotals — ended_at이 찬 배정은 셈에서 빠진다", () => {
  it("정하늘(p3)의 취소된 배정은 byPerson에도 byPosition에도 안 든다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    expect(
      totals.byPerson.find((row) => row.profileId === "p3"),
    ).toBeUndefined();
    const scan = totals.byPosition.find((row) => row.position === "스캔");
    expect(scan?.minutes).toBe(480);
    expect(scan?.count).toBe(1);
  });
});

describe("computeWorkTotals — 포지션 아홉은 배정이 없어도 다 선다", () => {
  it("byPosition의 포지션 이름 집합이 POSITION_ORDER 아홉과 같다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    expect(totals.byPosition.map((row) => row.position).sort()).toEqual(
      [...POSITION_ORDER].sort(),
    );
  });

  it("배정이 없는 팀장은 0분·0건이다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const captain = totals.byPosition.find((row) => row.position === "팀장");

    expect(captain).toEqual({ position: "팀장", minutes: 0, count: 0 });
  });
});

describe("computeWorkTotals — 퇴사한 사람도 그 달에 일했으면 byPerson에 선다", () => {
  it("최윤아(p4)가 480분·1건으로 선다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const yoona = totals.byPerson.find((row) => row.profileId === "p4");

    expect(yoona).toEqual({
      profileId: "p4",
      displayName: "최윤아",
      minutes: 480,
      count: 1,
    });
  });
});

describe("computeWorkTotals — 겸임과 여러 날을 가진 사람의 시간이 날마다 더해진다", () => {
  it("김지우(p1)는 메인 480분과 교육 360분을 더해 840분·2건이다", () => {
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);

    const jiwoo = totals.byPerson.find((row) => row.profileId === "p1");

    expect(jiwoo).toEqual({
      profileId: "p1",
      displayName: "김지우",
      minutes: 840,
      count: 2,
    });
  });
});

describe("computeWorkTotals — 배정도 날도 없으면 전부 0이다", () => {
  it("totalMinutes·totalCount가 0이고 byPosition 아홉은 전부 0이다", () => {
    const totals = computeWorkTotals([], []);

    expect(totals.totalMinutes).toBe(0);
    expect(totals.totalCount).toBe(0);
    expect(totals.byPosition.every((row) => row.minutes === 0)).toBe(true);
  });
});

function scheduleDay(overrides: Partial<ScheduleDay> = {}): ScheduleDay {
  return {
    id: "day-1",
    work_date: "2026-09-01",
    starts_at: "10:00:00",
    ends_at: "18:00:00",
    opened_at: "2026-09-01T00:00:00.000Z",
    slots: [],
    check_ins: [],
    assignments: [],
    ...overrides,
  };
}

describe("workInputsOf — get-month-schedule이 실어 온 이름을 사람별 구획이 다시 안 읽고 그대로 옮긴다", () => {
  it("assignment.profiles.display_name이 있으면 그 이름을 display_name으로 낸다", () => {
    const inputs = workInputsOf([
      scheduleDay({
        assignments: [
          {
            id: "a1",
            slot_id: null,
            position: "메인",
            kind: "regular",
            profile_id: "p1",
            ended_at: null,
            profiles: { display_name: "김지우" },
          },
        ],
      }),
    ]);

    expect(inputs.assignments).toEqual([
      {
        id: "a1",
        day_id: "day-1",
        profile_id: "p1",
        display_name: "김지우",
        position: "메인",
        kind: "regular",
        ended_at: null,
      },
    ]);
  });

  it("profiles가 null이면 display_name이 빈 문자열이다 — 프로필을 다시 읽으러 가지 않는다", () => {
    const inputs = workInputsOf([
      scheduleDay({
        assignments: [
          {
            id: "a1",
            slot_id: null,
            position: "메인",
            kind: "regular",
            profile_id: "p1",
            ended_at: null,
            profiles: null,
          },
        ],
      }),
    ]);

    expect(inputs.assignments[0]?.display_name).toBe("");
  });

  it("days는 work-totals가 쓰는 시각 필드 넷만 남기고 slots·check_ins는 안 딸려 온다", () => {
    const inputs = workInputsOf([
      scheduleDay({
        slots: [{ id: "slot-1", positions: ["메인"], ended_at: null }],
      }),
    ]);

    expect(inputs.days).toEqual([
      {
        id: "day-1",
        work_date: "2026-09-01",
        starts_at: "10:00:00",
        ends_at: "18:00:00",
      },
    ]);
  });

  it("날이 없으면 assignments도 days도 빈 배열이다", () => {
    const inputs = workInputsOf([]);

    expect(inputs).toEqual({ assignments: [], days: [] });
  });
});

describe("hoursLabel — 30분 꼬리를 반올림해 지우면 사람별 합과 포지션 합이 화면에서 안 맞아 보인다", () => {
  it("480분은 정각이라 '8시간'이다", () => {
    expect(hoursLabel(480)).toBe("8시간");
  });

  it("450분은 꼬리를 살려 '7.5시간'이다", () => {
    expect(hoursLabel(450)).toBe("7.5시간");
  });

  it("0분은 '0시간'이다", () => {
    expect(hoursLabel(0)).toBe("0시간");
  });
});

const LIVE_ASSIGNMENT: WorkAssignment = {
  id: "a1",
  day_id: "day-1",
  profile_id: "p1",
  display_name: "김지우",
  position: "메인",
  kind: "regular",
  ended_at: null,
};

describe("isLiveAssignment — 배정이 끝난 자국은 취소·교대로 넘어간 자리라 셈에서 빠질 대상이다", () => {
  it("ended_at이 null이면 산 배정이라 true다", () => {
    expect(isLiveAssignment(LIVE_ASSIGNMENT)).toBe(true);
  });

  it("ended_at이 차 있으면 false다", () => {
    expect(
      isLiveAssignment({
        ...LIVE_ASSIGNMENT,
        ended_at: "2026-09-05T00:00:00.000Z",
      }),
    ).toBe(false);
  });
});

const BASE_DAY: WorkDay = {
  id: "day-1",
  work_date: "2026-09-01",
  starts_at: "10:00:00",
  ends_at: "18:00:00",
};

describe("dayMinutes — 그날 근무 시간은 마감에서 시작을 뺀 값이라 사람마다 다시 안 잰다", () => {
  it("10:00:00~18:00:00은 480분이다", () => {
    expect(dayMinutes(BASE_DAY)).toBe(480);
  });

  it("09:00:00~17:30:00처럼 30분 꼬리가 있으면 510분으로 그 꼬리가 그대로 남는다", () => {
    expect(
      dayMinutes({ ...BASE_DAY, starts_at: "09:00:00", ends_at: "17:30:00" }),
    ).toBe(510);
  });
});
