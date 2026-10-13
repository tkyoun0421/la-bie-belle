import { POSITION_ORDER } from "@/entities/schedule/consts/schedule.const";
import {
  buildRoster,
  canShowShiftActions,
  rosterHeadcount,
  rosterOfDay,
  daySheetSubtitle,
} from "@/entities/schedule/model/daySheet.policy";

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

describe("rosterOfDay — 하루의 슬롯과 배정으로 명단을 만든다", () => {
  const day = {
    slots: [
      { id: "slot-1", positions: ["메인"], endedAt: null },
      { id: "slot-2", positions: ["스캔"], endedAt: null },
      { id: "slot-3", positions: ["안내"], endedAt: "2026-10-01T00:00:00Z" },
    ],
    assignments: [
      {
        id: "assignment-1",
        slotId: "slot-1",
        position: "메인",
        kind: "regular",
        profileId: "profile-1",
        endedAt: null,
        name: "김지우",
      },
      {
        id: "assignment-2",
        slotId: "slot-2",
        position: "스캔",
        kind: "regular",
        profileId: "profile-2",
        endedAt: "2026-10-01T00:00:00Z",
        name: "박서연",
      },
    ],
  };

  it("끝난 슬롯은 자리로 안 세고 끝난 배정은 명단에 안 넣는다", () => {
    expect(rosterOfDay(day)).toEqual([
      {
        position: "스캔",
        kind: "vacant",
      },
      {
        position: "메인",
        kind: "regular",
        profileId: "profile-1",
        displayName: "김지우",
      },
    ]);
  });

  it("교육 배정은 교육으로, 이름이 없으면 빈 글자로 옮긴다", () => {
    const roster = rosterOfDay({
      slots: [],
      assignments: [
        {
          id: "assignment-3",
          slotId: null,
          position: "메인",
          kind: "training",
          profileId: "profile-3",
          endedAt: null,
          name: null,
        },
      ],
    });

    expect(roster).toEqual([
      {
        position: "메인",
        kind: "training",
        profileId: "profile-3",
        displayName: "",
      },
    ]);
  });
});

describe("daySheetSubtitle — 시간대와 인원을 한 줄로 적는다", () => {
  it("분까지만 자른 시작과 끝, 인원수를 적는다", () => {
    expect(daySheetSubtitle("10:00:00", "19:00:00", 3)).toBe(
      "10:00 – 19:00 · 3명",
    );
  });

  it("인원이 0이어도 적는다", () => {
    expect(daySheetSubtitle("10:00:00", "19:00:00", 0)).toBe(
      "10:00 – 19:00 · 0명",
    );
  });
});
