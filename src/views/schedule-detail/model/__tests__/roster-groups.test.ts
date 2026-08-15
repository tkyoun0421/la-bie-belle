import { describe, expect, it } from "vitest";

import type { ConfirmedRosterRow } from "@/entities/schedule/model/confirmed-roster";
import {
  buildRosterGroups,
  deriveMyRosterPositions,
} from "@/views/schedule-detail/model/roster-groups";

function row(overrides: Partial<ConfirmedRosterRow>): ConfirmedRosterRow {
  return {
    name: "이름",
    positionName: "매니저",
    sortOrder: 80,
    isTrainee: false,
    isSelf: false,
    ...overrides,
  };
}

describe("buildRosterGroups", () => {
  it("정식·교육생이 섞인 행을 포지션별 그룹으로 나누고 정식을 위·교육생을 아래에 둔다", () => {
    const groups = buildRosterGroups([
      row({ name: "정식1", positionName: "축가", sortOrder: 50, isTrainee: false }),
      row({ name: "교육1", positionName: "축가", sortOrder: 50, isTrainee: true }),
    ]);

    expect(groups).toEqual([
      {
        positionName: "축가",
        sortOrder: 50,
        regular: [{ name: "정식1", isSelf: false, displayIndex: 0 }],
        trainees: [{ name: "교육1", isSelf: false, displayIndex: 1 }],
      },
    ]);
  });

  it("겸직자는 맡은 포지션 그룹마다 중복으로 등장한다", () => {
    const groups = buildRosterGroups([
      row({ name: "겸직자", positionName: "매니저", sortOrder: 80 }),
      row({ name: "겸직자", positionName: "축가", sortOrder: 50 }),
    ]);

    expect(groups.map((g) => g.positionName)).toEqual(["축가", "매니저"]);
    expect(groups[0]!.regular).toEqual([{ name: "겸직자", isSelf: false, displayIndex: 0 }]);
    expect(groups[1]!.regular).toEqual([{ name: "겸직자", isSelf: false, displayIndex: 1 }]);
  });

  it("경계값: 정식 배정자 없이 교육생만 있는 포지션은 regular가 빈 배열이다(담당자 없음)", () => {
    const groups = buildRosterGroups([
      row({ name: "교육생", positionName: "드레스", sortOrder: 40, isTrainee: true }),
    ]);

    expect(groups).toEqual([
      {
        positionName: "드레스",
        sortOrder: 40,
        regular: [],
        trainees: [{ name: "교육생", isSelf: false, displayIndex: 0 }],
      },
    ]);
  });

  it("경계값: 빈 입력은 빈 배열을 반환한다", () => {
    expect(buildRosterGroups([])).toEqual([]);
  });

  it("sort_order 오름차순으로 정렬하고 동률이면 포지션명 이름순으로 보조 정렬한다", () => {
    const groups = buildRosterGroups([
      row({ name: "라마바정식", positionName: "라마바", sortOrder: 1000 }),
      row({ name: "매니저정식", positionName: "매니저", sortOrder: 80 }),
      row({ name: "가나다정식", positionName: "가나다", sortOrder: 1000 }),
    ]);

    expect(groups.map((g) => g.positionName)).toEqual(["매니저", "가나다", "라마바"]);
  });

  it("본인 여부(isSelf)를 각 구성원에 유지한다", () => {
    const groups = buildRosterGroups([row({ name: "나", isSelf: true })]);

    expect(groups[0]!.regular).toEqual([{ name: "나", isSelf: true, displayIndex: 0 }]);
  });

  it("displayIndex를 그룹을 가로질러 표시 순서대로 0부터 매긴다", () => {
    const groups = buildRosterGroups([
      row({ name: "정식1", positionName: "축가", sortOrder: 50, isTrainee: false }),
      row({ name: "교육1", positionName: "축가", sortOrder: 50, isTrainee: true }),
      row({ name: "정식2", positionName: "매니저", sortOrder: 80, isTrainee: false }),
    ]);

    expect(groups[0]!.regular[0]!.displayIndex).toBe(0);
    expect(groups[0]!.trainees[0]!.displayIndex).toBe(1);
    expect(groups[1]!.regular[0]!.displayIndex).toBe(2);
  });
});

describe("deriveMyRosterPositions", () => {
  it("본인 행만 포지션명·교육생 여부로 추출한다", () => {
    const positions = deriveMyRosterPositions([
      row({ name: "나", positionName: "매니저", isSelf: true, isTrainee: false }),
      row({ name: "나", positionName: "축가", isSelf: true, isTrainee: true }),
      row({ name: "다른사람", positionName: "안내", isSelf: false }),
    ]);

    expect(positions).toEqual([
      { positionName: "매니저", isTrainee: false },
      { positionName: "축가", isTrainee: true },
    ]);
  });

  it("경계값: 본인 행이 없으면 빈 배열이다(미배정 근무자)", () => {
    expect(deriveMyRosterPositions([row({ isSelf: false })])).toEqual([]);
  });

  it("경계값: 빈 입력은 빈 배열이다", () => {
    expect(deriveMyRosterPositions([])).toEqual([]);
  });
});
