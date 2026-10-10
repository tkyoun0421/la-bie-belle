import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-layer-reexport";

const SCREENS_FILE = "src/screens/fixture/model/fixture.policy.ts";

const ENTITIES_FILE = "src/entities/fixture/utils/fixture.utils.ts";

const SHARED_FILE = "src/shared/utils/fixture.utils.ts";

async function ruleIdsOf(code: string, filePath = SCREENS_FILE) {
  return (await violationsOf(code, filePath)).map(
    (violation) => violation.ruleId,
  );
}

describe("house/no-layer-reexport", () => {
  it("`export { 이름 } from` 꼴이 걸린다", async () => {
    const code =
      'export { kstDateOf, spellDate } from "@/shared/utils/kstDate";\n';

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("import한 뒤 따로 `export {}` 하는 꼴도 걸린다", async () => {
    const code = [
      'import { lastDateOfMonth } from "@/shared/utils/kstDate";',
      "",
      "export { lastDateOfMonth };",
      "",
      "export function isPast(month: string, today: string): boolean {",
      "  return lastDateOfMonth(month) < today;",
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("`export {}` 가 import보다 위에 있어도 걸린다", async () => {
    const code = [
      "export { lastDateOfMonth };",
      "",
      'import { lastDateOfMonth } from "@/shared/utils/kstDate";',
    ].join("\n");

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("`export * from` 도 걸린다", async () => {
    const code = 'export * from "@/shared/utils/kstDate";\n';

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("타입만 다시 내보내는 것도 걸린다", async () => {
    const code =
      'export type { OpenSlot } from "@/entities/schedule/model/schedule.type";\n';

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("이름을 바꿔 다시 내보내는 것도 걸린다", async () => {
    const code = [
      'import { kstDateOf } from "@/shared/utils/kstDate";',
      "",
      "export { kstDateOf as today };",
    ].join("\n");

    expect(await ruleIdsOf(code)).toContain(RULE_ID);
  });

  it("`entities`의 재수출도 걸린다", async () => {
    const code = 'export { spellMonth } from "@/shared/utils/kstDate";\n';

    expect(await ruleIdsOf(code, ENTITIES_FILE)).toContain(RULE_ID);
  });

  it("지역 선언을 다른 이름으로 내보내는 것은 통과한다", async () => {
    const code = [
      "type RehearsalTotal = { count: number; minutes: number };",
      "",
      "function total(rows: readonly number[]): RehearsalTotal {",
      "  return { count: rows.length, minutes: rows.reduce((sum, n) => sum + n, 0) };",
      "}",
      "",
      "export { total as dayTotal, total as monthTotal };",
    ].join("\n");

    expect(await ruleIdsOf(code, ENTITIES_FILE)).not.toContain(RULE_ID);
  });

  it("import한 이름을 자기 안에서만 쓰는 것은 통과한다", async () => {
    const code = [
      'import { kstDateOf } from "@/shared/utils/kstDate";',
      "",
      "export function startsToday(instant: string, today: string): boolean {",
      "  return kstDateOf(instant) === today;",
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("선언 자리에서 바로 내보내는 것은 통과한다", async () => {
    const code = [
      'export type Verdict = "open" | "closed";',
      "",
      "export function verdict(isOpen: boolean): Verdict {",
      '  return isOpen ? "open" : "closed";',
      "}",
    ].join("\n");

    expect(await ruleIdsOf(code)).not.toContain(RULE_ID);
  });

  it("`shared`의 재수출은 통과한다", async () => {
    const code = [
      'import { kstDateOf } from "@/shared/utils/kstDate";',
      "",
      "export { kstDateOf };",
    ].join("\n");

    expect(await ruleIdsOf(code, SHARED_FILE)).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 어느 자리에서 직접 받아야 하는지 든다", async () => {
    const code = 'export { kstDateOf } from "@/shared/utils/kstDate";\n';
    const message = (await violationsOf(code, SCREENS_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/@\/shared\/utils\/kstDate/);
    expect(message).toMatch(/직접 받아야/);
  });

  it("import한 이름을 다시 내보낼 때는 그 이름과 출처를 든다", async () => {
    const code = [
      'import { kstDateOf } from "@/shared/utils/kstDate";',
      "",
      "export { kstDateOf };",
    ].join("\n");
    const message = (await violationsOf(code, SCREENS_FILE)).find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/kstDateOf/);
    expect(message).toMatch(/@\/shared\/utils\/kstDate/);
  });
});
