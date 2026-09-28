// 구현 대상: src/features/stats/model/person-days.ts
//
// computePersonDays(profileId, assignments, days) — 한 사람의 날짜별 근무다
// (plan stats-admin AC-02, spec stats-admin AC-02). WorkAssignment·WorkDay는
// work-totals.ts와 같은 모양이다(fixtures.ts 참고).
//
// 결과는 { days: PersonDayRow[], totalMinutes, totalCount }다. PersonDayRow는
// { workDate, position, minutes }이고 날짜순이다.
//
// **겸임인 날은 앞 포지션만 낸다.** spec AC-02·stats.md「근무 내역 시트」— "겸임인
// 날은 앞 포지션만 적는다. 포지션 구획이 세는 방식과 같다. 두 포지션을 다 적으면
// 시간이 두 번 든 것처럼 읽힌다." work-totals.ts가 앞 포지션 하나로만 세는 것과
// 같은 규칙이라 이 시트의 날짜별 목록도 하루에 한 줄만 낸다.
//
// **시트 합계 = 구획 줄의 값.** 같은 픽스처를 computeWorkTotals에도 먹여 두
// 함수의 합계가 실제로 같은 값을 내는지를 이 파일이 단언한다 — 다르면 시트와
// 구획 중 하나가 틀렸다는 뜻이고 그것을 눈으로 확인하는 것이 이 시트의 쓸모다.

import { ASSIGNMENTS, DAYS } from "@/features/stats/model/__tests__/fixtures";
import { computePersonDays } from "@/features/stats/model/person-days";
import { computeWorkTotals } from "@/features/stats/model/work-totals";

describe("computePersonDays — 한 사람의 날짜별 근무가 날짜순으로 선다", () => {
  it("김지우(p1)는 9월 1일 메인, 9월 3일 안내(교육) 순으로 두 줄이다", () => {
    const result = computePersonDays("p1", ASSIGNMENTS, DAYS);

    expect(result.days).toEqual([
      { workDate: "2026-09-01", position: "메인", minutes: 480, label: "메인" },
      {
        workDate: "2026-09-03",
        position: "안내",
        minutes: 360,
        label: "안내 교육",
      },
    ]);
  });
});

describe("computePersonDays — 교육 배정은 어느 포지션의 교육이었는지를 한 줄에 적는다(stats.md 「근무 내역 시트」)", () => {
  it("김지우(p1)의 9월 3일 교육 배정은 label이 '안내 교육'이다 — position만으로는 교육인지가 안 드러난다", () => {
    const result = computePersonDays("p1", ASSIGNMENTS, DAYS);
    const trainingRow = result.days.find(
      (row) => row.workDate === "2026-09-03",
    );

    expect(trainingRow?.label).toBe("안내 교육");
  });

  it("정규 배정은 label이 포지션 이름 그대로다 — '메인 교육'처럼 안 붙는다", () => {
    const result = computePersonDays("p1", ASSIGNMENTS, DAYS);
    const regularRow = result.days.find((row) => row.workDate === "2026-09-01");

    expect(regularRow?.label).toBe("메인");
  });
});

describe("computePersonDays — 시트 합계가 work-totals의 사람별 줄 값과 같다", () => {
  it("김지우(p1)의 합계(840분·2건)가 byPerson의 값과 같다", () => {
    const personDays = computePersonDays("p1", ASSIGNMENTS, DAYS);
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);
    const jiwoo = totals.byPerson.find((row) => row.profileId === "p1");

    expect(personDays.totalMinutes).toBe(jiwoo?.minutes);
    expect(personDays.totalCount).toBe(jiwoo?.count);
  });

  it("박서연(p2)의 합계(480분·1건)도 byPerson의 값과 같다", () => {
    const personDays = computePersonDays("p2", ASSIGNMENTS, DAYS);
    const totals = computeWorkTotals(ASSIGNMENTS, DAYS);
    const seoyeon = totals.byPerson.find((row) => row.profileId === "p2");

    expect(personDays.totalMinutes).toBe(seoyeon?.minutes);
    expect(personDays.totalCount).toBe(seoyeon?.count);
  });
});

describe("computePersonDays — 겸임인 날은 앞 포지션만 낸다", () => {
  it("박서연(p2)의 9월 2일 줄은 드레스실 하나뿐이고 대기실 줄은 안 생긴다", () => {
    const result = computePersonDays("p2", ASSIGNMENTS, DAYS);

    expect(result.days).toEqual([
      {
        workDate: "2026-09-02",
        position: "드레스실",
        minutes: 480,
        label: "드레스실",
      },
    ]);
  });
});

describe("computePersonDays — 그 사람의 배정이 없으면 빈 목록이다", () => {
  it("존재하지 않는 profileId는 days가 비고 합계가 0이다", () => {
    const result = computePersonDays("no-such-person", ASSIGNMENTS, DAYS);

    expect(result.days).toEqual([]);
    expect(result.totalMinutes).toBe(0);
    expect(result.totalCount).toBe(0);
  });
});
