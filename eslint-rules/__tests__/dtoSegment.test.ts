import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/dto-segment";

async function ruleIdsOf(code: string, filePath: string) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

const DTO = "@/entities/schedule/api/schedule.dto";

describe("house/dto-segment — 통신이 주고받는 꼴은 api를 안 떠난다", () => {
  it("`services`가 DTO를 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport type Fixture = ScheduleDay;\n`,
      "src/entities/schedule/services/useFixtureQuery.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`api/` 안에서 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport type Fixture = ScheduleDay;\n`,
      "src/entities/schedule/api/getFixture.api.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("다른 슬라이스의 `api/`도 DTO를 당길 수 있다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport type Fixture = ScheduleDay;\n`,
      "src/features/hallDefaults/api/setFixture.api.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`screens`의 `utils`가 당기면 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport type Fixture = ScheduleDay;\n`,
      "src/screens/stats/utils/fixture.utils.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("도메인 타입을 당기는 것은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { Schedule } from "@/entities/schedule/model/schedule.type";\n\nexport type Fixture = Schedule;\n`,
      "src/screens/stats/utils/fixture.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("되내보내는 것도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export type { ScheduleDay } from "${DTO}";\n`,
      "src/entities/schedule/model/schedule.type.ts",
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`api/` 밖에 사는 `.dto` 이름은 이 규칙이 안 본다", async () => {
    const ruleIds = await ruleIdsOf(
      `import { shape } from "@/shared/utils/fixture.dto";\n\nexport const fixture = shape;\n`,
      "src/screens/stats/utils/fixture.utils.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("매퍼는 밖이다 — 꼴을 바꾸는 유일한 자리다", async () => {
    const ruleIds = await ruleIdsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport const toFixture = (row: ScheduleDay) => row;\n`,
      "src/entities/schedule/utils/schedule.mapper.ts",
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 갈 자리 둘을 든다", async () => {
    const violations = await violationsOf(
      `import type { ScheduleDay } from "${DTO}";\n\nexport type Fixture = ScheduleDay;\n`,
      "src/screens/stats/utils/fixture.utils.ts",
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/mapper/);
    expect(message).toMatch(/\.type\.ts/);
  });
});
