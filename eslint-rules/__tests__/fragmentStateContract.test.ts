import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/fragment-state-contract";

async function ruleIdsOf(
  code: string,
  filePath = "src/entities/fixture/hooks/useFixture.ts",
) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/fragment-state-contract — 납작한 상태를 문다", () => {
  it("가지를 안 가른 controller가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController = {\n  state: "pending" | "failed" | "ready";\n  rows: string[];\n};\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("상태를 타입 이름으로 미뤄도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { FixtureState } from "@/entities/fixture/model/fixture.type";\n\nexport type FixtureController = {\n  state: FixtureState;\n  rows: string[];\n};\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("판별 union은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "failed" }\n  | { state: "empty" }\n  | { state: "ready"; rows: string[] };\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("가지가 자기 데이터를 들어도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "empty"; reason: "noMembers" | "noMatch" }\n  | { state: "ready"; rows: string[]; hasMore: boolean };\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — 정본 밖의 상태 이름을 문다", () => {
  it("loading이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "loading" }\n  | { state: "ready"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("rows가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "rows"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("다음 쪽이 있나를 상태로 만들면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "pending" }\n  | { state: "normal"; rows: string[] }\n  | { state: "end"; rows: string[] };\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("쓰는 중은 sending 하나만 통과한다", async () => {
    const sending = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "sending" }\n  | { state: "ready" };\n`,
    );

    const saving = await ruleIdsOf(
      `export type FixtureController =\n  | { state: "saving" }\n  | { state: "ready" };\n`,
    );

    expect(sending).not.toContain(RULE_ID);
    expect(saving).toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — 목록 상태와 몸통도 본다", () => {
  it("납작한 ListState가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureListState = {\n  state: "pending" | "empty" | "ready";\n  tab: "work" | "attendance";\n};\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("ListState의 정본 밖 상태 이름이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureListState =\n  | { state: "loading" }\n  | { state: "ready"; tab: "work" };\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("탭을 상태 이름으로 올린 ListState가 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureListState =\n  | { state: "pending" }\n  | { state: "work" }\n  | { state: "attendance" };\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("판별 union인 ListState는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureListState =\n  | { state: "pending" }\n  | { state: "failed" }\n  | { state: "empty" }\n  | { state: "ready"; tab: "work" | "attendance" };\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("몸통의 정본 밖 상태 이름이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureBody =\n  | { state: "loading" }\n  | { state: "ready" };\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("판별 union인 몸통은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureBody =\n  | { state: "pending" }\n  | { state: "ready"; view: "calendar" | "position" };\n`,
      "src/screens/fixture/hooks/useFixtureScreen.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — 읽기 상태 어휘를 쓰는 다른 별칭은 안 문다", () => {
  it("승인 대기는 도메인 상태다", async () => {
    const attendance = await ruleIdsOf(
      `export type AttendanceStatus =\n  "unmarked" | "present" | "late" | "pending" | "excused" | "absent";\n`,
      "src/entities/attendance/model/attendance.type.ts",
    );

    const member = await ruleIdsOf(
      `export type MemberKind = "active" | "left" | "pending" | "blocked";\n`,
      "src/entities/member/services/useMembersQuery.ts",
    );

    expect(attendance).not.toContain(RULE_ID);
    expect(member).not.toContain(RULE_ID);
  });

  it("푸시가 닿는지의 판정은 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type ReachState =\n  "loading" | "denied" | "off" | "no-device" | "reachable";\n`,
      "src/entities/notification/model/reachState.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("쓰기 흐름의 시트 얼굴과 단계는 밖이다", async () => {
    const face = await ruleIdsOf(
      `export type ConfirmSheetFace = "done" | "failed" | "ask";\n`,
      "src/features/scheduleConfirm/model/confirmSheet.type.ts",
    );

    const stage = await ruleIdsOf(
      `export type PendingStage =\n  "loading" | "signedOut" | "form" | "celebrating" | "waiting" | "rejected";\n`,
      "src/screens/pending/model/pendingForm.type.ts",
    );

    expect(face).not.toContain(RULE_ID);
    expect(stage).not.toContain(RULE_ID);
  });

  it("칸과 카드의 생김새는 밖이다", async () => {
    const cell = await ruleIdsOf(
      `export type RehearsalDayCellState = "empty" | "has";\n`,
      "src/shared/model/rehearsalDayCell.policy.ts",
    );

    const card = await ruleIdsOf(
      `export type SlotCardVariant = "filled" | "empty";\n`,
      "src/shared/ui/SlotCard.tsx",
    );

    expect(cell).not.toContain(RULE_ID);
    expect(card).not.toContain(RULE_ID);
  });
});

describe("house/fragment-state-contract — controller가 아닌 state는 안 문다", () => {
  it("reducer가 드는 상태 덩이는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type AddSheetState = {\n  values: { note: string };\n  touched: boolean;\n};\n\nexport function reduce(state: AddSheetState): AddSheetState {\n  return state;\n}\n`,
      "src/features/fixture/model/addSheetState.reducer.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("policy가 내는 판정 이름은 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type RehearsalDayCellState = "empty" | "has";\n\nexport type RehearsalDayCell = {\n  state: RehearsalDayCellState;\n};\n`,
      "src/screens/fixture/model/rehearsalDayCell.policy.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("컴포넌트 props의 그림 상태는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type ScheduleDayCellState = "off" | "picked" | "assigned";\n\nexport type ScheduleDayCellProps = {\n  state: ScheduleDayCellState;\n};\n`,
      "src/shared/ui/ScheduleDayCell.tsx",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("글자가 아닌 상태 덩이를 든 controller는 밖이다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type FixtureController = {\n  sending: boolean;\n  failedLine: string | null;\n};\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });
});
