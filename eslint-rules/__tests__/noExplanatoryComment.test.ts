import { violationsOf } from "@tests/lint/ruleCheck";

const RULE_ID = "house/no-explanatory-comment";

const FIXTURE = "src/shared/utils/fixture.ts";

async function ruleIdsOf(code: string, filePath = FIXTURE) {
  const violations = await violationsOf(code, filePath);

  return violations.map((violation) => violation.ruleId);
}

describe("house/no-explanatory-comment — 설명 주석을 막는다", () => {
  it("줄 주석이 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const ready = true;\n`.replace(
        "export",
        "// 준비됐다는 뜻이다\nexport",
      ),
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("블록 주석도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `/* 이 값이 무엇인지 적는다 */\nexport const ready = true;\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("JSDoc 산문도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(
      `/**\n * 무엇을 하는 함수인지 적는다.\n */\nexport function act() {\n  return 1;\n}\n`,
    );

    expect(ruleIds).toContain(RULE_ID);
  });

  it("줄 끝 주석도 걸린다", async () => {
    const ruleIds = await ruleIdsOf(`export const DAYS = 7; // 한 주\n`);

    expect(ruleIds).toContain(RULE_ID);
  });

  it("`eslint-disable`은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `/* eslint-disable no-console -- 이 자리는 로그를 낸다 */\nexport const ready = true;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`eslint-disable-next-line`도 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `// eslint-disable-next-line no-console\nexport const ready = true;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`@ts-expect-error`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `// @ts-expect-error 대상이 아직 없다\nexport const ready = true;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("`prettier-ignore`는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `// prettier-ignore\nexport const grid = [1, 2, 3];\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("타입을 얹는 JSDoc은 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `/** @type {readonly number[]} */\nexport const days = [1];\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("삼중 슬래시 참조는 통과한다", async () => {
    const ruleIds = await ruleIdsOf(
      `/// <reference types="jest" />\nexport const ready = true;\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("문자열 안의 두 슬래시는 주석이 아니다", async () => {
    const ruleIds = await ruleIdsOf(
      `export const home = "https://example.test/path";\n`,
    );

    expect(ruleIds).not.toContain(RULE_ID);
  });

  it("규칙 메시지가 근거가 사는 자리를 든다", async () => {
    const violations = await violationsOf(
      `// 설명이다\nexport const ready = true;\n`,
      FIXTURE,
    );
    const message = violations.find(
      (violation) => violation.ruleId === RULE_ID,
    )?.message;

    expect(message).toMatch(/docs\//);
  });
});
