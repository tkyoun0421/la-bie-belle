// 구현 대상: src/features/stats/model/myTotals.ts (아직 없다)
//
// computeMyWorkTotals(assignments, days, profileId) — workTotals.ts의
// computeWorkTotals를 그대로 불러 입력을 그 사람 배정으로 좁힌다(plan
// stats-worker AC-01, spec stats-worker AC-03). 집계를 다시 짜지 않는다 —
// 아래 값은 전부 computeWorkTotals가 이미 내는 값과 같아야 한다.
//
// { totalMinutes, totalCount, byPosition }을 낸다. byPosition은 관리자
// workTotals.ts의 byPosition(POSITION_ORDER 아홉이 늘 다 서는 것)과 반대로
// **그 사람이 들어간 포지션만** 남는다 — count가 0인 포지션은 목록에서
// 아예 빠진다(stats.md 「내 포지션」, 관리자 쪽이 아홉을 다 세우는 것과 반대).

import { ASSIGNMENTS, DAYS } from "@/features/stats/model/__tests__/fixtures";
import { computeWorkTotals } from "@/features/stats/model/workTotals.policy";
import { computeMyWorkTotals } from "@/features/stats/utils/myTotals.utils";

describe("computeMyWorkTotals — workTotals.ts를 다시 안 짜고 그대로 불러 내 배정으로 좁힌다", () => {
  it("김지우(p1)의 총 시간·건수가 관리자 byPerson의 값과 같다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p1");
    const admin = computeWorkTotals(ASSIGNMENTS, DAYS);
    const jiwoo = admin.byPerson.find((row) => row.profileId === "p1");

    expect(mine.totalMinutes).toBe(jiwoo?.minutes);
    expect(mine.totalCount).toBe(jiwoo?.count);
    expect(mine.totalMinutes).toBe(840);
    expect(mine.totalCount).toBe(2);
  });

  it("박서연(p2)의 총 시간·건수도 관리자 byPerson의 값과 같다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p2");
    const admin = computeWorkTotals(ASSIGNMENTS, DAYS);
    const seoyeon = admin.byPerson.find((row) => row.profileId === "p2");

    expect(mine.totalMinutes).toBe(seoyeon?.minutes);
    expect(mine.totalCount).toBe(seoyeon?.count);
  });
});

describe("computeMyWorkTotals — 내가 안 들어간 포지션은 목록에서 빠진다(관리자 쪽은 아홉을 다 세우는 것과 반대다)", () => {
  it("김지우(p1)는 메인·안내 둘뿐이고 나머지 일곱은 줄 자체가 없다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p1");

    expect(mine.byPosition.map((row) => row.position)).toEqual([
      "메인",
      "안내",
    ]);
  });

  it("배정이 하나도 없는 사람은 byPosition이 빈 배열이다 — 0분짜리 여덟 줄이 안 선다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "no-such-person");

    expect(mine.byPosition).toEqual([]);
    expect(mine.totalMinutes).toBe(0);
    expect(mine.totalCount).toBe(0);
  });
});

describe("computeMyWorkTotals — 겸임은 앞 포지션 하나로만 센다(관리자 쪽과 같은 규칙이다)", () => {
  it("박서연(p2)은 드레스실 480분·1건뿐이고 대기실 줄은 아예 안 선다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p2");

    expect(mine.byPosition).toEqual([
      { position: "드레스실", minutes: 480, count: 1 },
    ]);
  });
});

describe("computeMyWorkTotals — 교육 배정도 내 포지션 목록에 든다(ATT-020)", () => {
  it("김지우(p1)의 안내 교육 배정이 360분·1건으로 선다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p1");
    const guide = mine.byPosition.find((row) => row.position === "안내");

    expect(guide).toEqual({ position: "안내", minutes: 360, count: 1 });
  });
});

describe("computeMyWorkTotals — ended_at이 찬 배정은 내 집계에서도 빠진다", () => {
  it("정하늘(p3)의 취소된 배정은 셈에 안 들어 전부 0이다", () => {
    const mine = computeMyWorkTotals(ASSIGNMENTS, DAYS, "p3");

    expect(mine.totalMinutes).toBe(0);
    expect(mine.totalCount).toBe(0);
    expect(mine.byPosition).toEqual([]);
  });
});
