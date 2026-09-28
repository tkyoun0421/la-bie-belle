// 구현 대상: src/features/stats/model/work-totals.ts
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

import { POSITION_ORDER } from "@/entities/schedule/model/positions";
import { computeWorkTotals } from "@/features/stats/model/work-totals";
import { ASSIGNMENTS, DAYS } from "@/features/stats/model/__tests__/fixtures";

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
