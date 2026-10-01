import {
  POSITION_ORDER,
  buildRoster,
  canShowShiftActions,
  rosterHeadcount,
} from "@/screens/schedule-worker/model/day-sheet";

describe("POSITION_ORDER — 명단이 서는 포지션 정본 순서", () => {
  it("schedule/README.md의 아홉 포지션 순서 그대로다", () => {
    expect(POSITION_ORDER).toEqual([
      "팀장",
      "스캔",
      "메인",
      "드레스",
      "축가",
      "매니저",
      "안내",
      "드레스실",
      "대기실",
    ]);
  });
});

describe("buildRoster — 명단이 포지션 정본 순서로 선다", () => {
  it("입력 순서가 뒤섞여도 정본 순서로 정렬한다", () => {
    const roster = buildRoster(
      [
        { position: "안내", capacity: 1 },
        { position: "팀장", capacity: 1 },
      ],
      [
        {
          position: "안내",
          kind: "regular",
          profileId: "profile-1",
          displayName: "박서연",
        },
        {
          position: "팀장",
          kind: "regular",
          profileId: "profile-2",
          displayName: "김지수",
        },
      ],
    );

    expect(roster.map((row) => row.position)).toEqual(["팀장", "안내"]);
  });

  it("정규 배정이 자리 수보다 적으면 빈 자리 줄이 채운다", () => {
    const roster = buildRoster(
      [{ position: "안내", capacity: 2 }],
      [
        {
          position: "안내",
          kind: "regular",
          profileId: "profile-1",
          displayName: "박서연",
        },
      ],
    );

    expect(roster).toEqual([
      {
        kind: "regular",
        position: "안내",
        profileId: "profile-1",
        displayName: "박서연",
      },
      { kind: "vacant", position: "안내" },
    ]);
  });

  it("교육 배정은 정규 자리를 안 먹고 그 포지션에 덧붙는다", () => {
    const roster = buildRoster(
      [{ position: "안내", capacity: 2 }],
      [
        {
          position: "안내",
          kind: "regular",
          profileId: "profile-1",
          displayName: "박서연",
        },
        {
          position: "안내",
          kind: "regular",
          profileId: "profile-2",
          displayName: "이도윤",
        },
        {
          position: "안내",
          kind: "training",
          profileId: "profile-3",
          displayName: "최민준",
        },
      ],
    );

    expect(roster).toEqual([
      {
        kind: "regular",
        position: "안내",
        profileId: "profile-1",
        displayName: "박서연",
      },
      {
        kind: "regular",
        position: "안내",
        profileId: "profile-2",
        displayName: "이도윤",
      },
      {
        kind: "training",
        position: "안내",
        profileId: "profile-3",
        displayName: "최민준",
      },
    ]);
  });
});

describe("rosterHeadcount — 부제 인원은 정규와 교육을 같이 센다", () => {
  it("빈 자리는 안 세고 정규·교육은 같이 센다", () => {
    const count = rosterHeadcount([
      {
        kind: "regular",
        position: "안내",
        profileId: "profile-1",
        displayName: "박서연",
      },
      { kind: "vacant", position: "안내" },
      {
        kind: "training",
        position: "드레스",
        profileId: "profile-2",
        displayName: "이도윤",
      },
    ]);

    expect(count).toBe(2);
  });
});

describe("canShowShiftActions — 근무 취소·교대 요청 버튼은 근무 전날까지만 선다", () => {
  it("내 근무 날이고 근무 전날이면 선다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: true,
      workDate: "2026-10-10",
      today: "2026-10-09",
    });

    expect(shown).toBe(true);
  });

  it("근무 당일부터는 안 선다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: true,
      workDate: "2026-10-10",
      today: "2026-10-10",
    });

    expect(shown).toBe(false);
  });

  it("근무가 지났으면 안 선다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: true,
      workDate: "2026-10-10",
      today: "2026-10-11",
    });

    expect(shown).toBe(false);
  });

  it("내가 안 나가는 날에는 근무 전날이어도 안 선다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: false,
      workDate: "2026-10-10",
      today: "2026-10-09",
    });

    expect(shown).toBe(false);
  });

  it("살아 있는 취소 요청 중이면 조건을 다 만족해도 안 선다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: true,
      workDate: "2026-10-10",
      today: "2026-10-09",
      hasActiveCancelRequest: true,
    });

    expect(shown).toBe(false);
  });

  it("취소 요청이 없으면(생략) 그대로 기존 규칙을 따른다", () => {
    const shown = canShowShiftActions({
      isMyAssignment: true,
      workDate: "2026-10-10",
      today: "2026-10-09",
      hasActiveCancelRequest: false,
    });

    expect(shown).toBe(true);
  });
});
