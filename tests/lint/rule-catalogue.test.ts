import { existsSync } from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DOCUMENTED_LINT_RULE_COUNT,
  RULES,
  RULE_NUMBERS_NEVER_ASSIGNED,
  type EnforcedRule,
} from "@tests/lint/rules";

const PROBE_FILE = "src/shared/ui/card.tsx";

const LINT_MECHANISMS: EnforcedRule["mechanism"][] = [
  "eslint",
  "house",
  "prettier",
];

async function resolveConfig() {
  const eslint = new ESLint({ overrideConfigFile: "eslint.config.mjs" });
  return eslint.calculateConfigForFile(path.join(process.cwd(), PROBE_FILE));
}

function isTurnedOn(entry: unknown) {
  const severity = Array.isArray(entry) ? entry[0] : entry;
  return (
    severity === 2 ||
    severity === "error" ||
    severity === 1 ||
    severity === "warn"
  );
}

function ruleIdsOf(mechanisms: EnforcedRule["mechanism"][]) {
  return RULES.filter(
    (rule) => mechanisms.includes(rule.mechanism) && rule.ruleId !== null,
  ).map((rule) => rule.ruleId as string);
}

describe("규칙 카탈로그", () => {
  let config: Awaited<ReturnType<typeof resolveConfig>>;

  beforeAll(async () => {
    config = await resolveConfig();
  }, 60_000);

  it("카탈로그가 켜졌다고 적은 규칙은 실제 config에서 켜져 있다", () => {
    const turnedOff = ruleIdsOf(["eslint", "house"]).filter(
      (ruleId) => !isTurnedOn(config.rules?.[ruleId]),
    );

    expect(turnedOff).toEqual([]);
  });

  it("house 플러그인이 내보내는 규칙은 전부 카탈로그에 있다", () => {
    const registered = Object.keys(config.plugins.house.rules)
      .map((name) => `house/${name}`)
      .sort();
    const catalogued = [...new Set(ruleIdsOf(["house"]))].sort();

    expect(catalogued).toEqual(registered);
  });

  it("카탈로그가 가리키는 테스트 파일은 디스크에 있다", () => {
    const missing = RULES.map((rule) => rule.test)
      .filter((file): file is string => file !== null)
      .filter((file) => !existsSync(path.join(process.cwd(), file)));

    expect([...new Set(missing)]).toEqual([]);
  });
});

describe("규칙 번호", () => {
  const numbers = [
    ...new Set([
      ...RULES.map((rule) => rule.no),
      ...RULE_NUMBERS_NEVER_ASSIGNED,
    ]),
  ].sort((a, b) => a - b);

  it("1부터 시작해 끊기지 않는다", () => {
    const unbroken = Array.from({ length: numbers.length }, (_, i) => i + 1);

    expect(numbers).toEqual(unbroken);
  });

  it("한 번호를 나눠 가진 규칙은 이름이 같고 ruleId가 서로 다르다", () => {
    const conflicting = numbers.filter((no) => {
      const shared = RULES.filter((rule) => rule.no === no);
      const names = new Set(shared.map((rule) => rule.name));
      const ruleIds = new Set(shared.map((rule) => rule.ruleId));
      return names.size > 1 || ruleIds.size !== shared.length;
    });

    expect(conflicting).toEqual([]);
  });

  it("끝내 정체를 못 찾은 번호는 카탈로그가 쓰지 않는다", () => {
    const claimed = RULES.filter((rule) =>
      RULE_NUMBERS_NEVER_ASSIGNED.includes(rule.no),
    );

    expect(claimed).toEqual([]);
  });

  it("문서가 말하는 열넷은 lint가 집행하는 마지막 번호다", () => {
    const lintNumbers = [
      ...RULES.filter((rule) => LINT_MECHANISMS.includes(rule.mechanism)).map(
        (rule) => rule.no,
      ),
      ...RULE_NUMBERS_NEVER_ASSIGNED,
    ];

    expect(Math.max(...lintNumbers)).toBe(DOCUMENTED_LINT_RULE_COUNT);
  });
});
