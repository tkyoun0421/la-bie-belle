import { accessSync, constants, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ESLint, type Linter } from "eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DOCUMENTED_LINT_RULE_COUNT,
  ENFORCED_RULE_COUNT,
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
  return severity === 2 || severity === "error";
}

function rulesEnforcedBy(mechanism: EnforcedRule["mechanism"]) {
  return RULES.filter((rule) => rule.mechanism === mechanism);
}

function registeredHookCommands() {
  const settings = JSON.parse(
    readFileSync(path.join(process.cwd(), ".claude/settings.json"), "utf8"),
  );

  return (settings.hooks?.PreToolUse ?? []).flatMap(
    (matcher: { hooks?: { command?: string }[] }) =>
      (matcher.hooks ?? []).map((hook) => hook.command ?? ""),
  );
}

function isExecutable(file: string) {
  try {
    accessSync(path.join(process.cwd(), file), constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function ruleIdsOf(mechanisms: EnforcedRule["mechanism"][]) {
  return RULES.filter(
    (rule) => mechanisms.includes(rule.mechanism) && rule.ruleId !== null,
  ).map((rule) => rule.ruleId as string);
}

function presetBaselineRuleIds() {
  const baseline = new Set<string>();

  for (const block of [...nextVitals, ...nextTs] as Linter.Config[]) {
    for (const ruleId of Object.keys(block.rules ?? {})) {
      baseline.add(ruleId);
    }
  }

  return baseline;
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

  it("훅으로 집행한다고 적은 규칙은 실제로 settings.json에 등록돼 있다", () => {
    const commands = registeredHookCommands().join("\n");
    const unregistered = rulesEnforcedBy("hook")
      .map((rule) => rule.enforcedBy as string)
      .filter((script) => !commands.includes(script));

    expect(unregistered).toEqual([]);
  });

  it("pre-commit으로 집행한다고 적은 규칙은 실행 가능한 파일을 가리킨다", () => {
    const notExecutable = rulesEnforcedBy("pre-commit")
      .map((rule) => rule.enforcedBy as string)
      .filter((file) => !isExecutable(file));

    expect(notExecutable).toEqual([]);
  });

  it("lint가 아닌 mechanism은 집행 파일을 반드시 적는다", () => {
    const unnamed = RULES.filter(
      (rule) => !LINT_MECHANISMS.includes(rule.mechanism),
    ).filter((rule) => rule.enforcedBy === null);

    expect(unnamed).toEqual([]);
  });

  it("카탈로그가 가리키는 테스트 파일은 디스크에 있다", () => {
    const missing = RULES.map((rule) => rule.test)
      .filter((file): file is string => file !== null)
      .filter((file) => !existsSync(path.join(process.cwd(), file)));

    expect([...new Set(missing)]).toEqual([]);
  });

  it("config가 켜둔 규칙 중 preset baseline에 없는 것은 전부 카탈로그에 있다", () => {
    const baseline = presetBaselineRuleIds();
    const turnedOnByConfig = Object.entries(config.rules ?? {})
      .filter(([, entry]) => isTurnedOn(entry))
      .map(([ruleId]) => ruleId);

    const beyondBaseline = turnedOnByConfig.filter(
      (ruleId) => !baseline.has(ruleId),
    );
    const catalogued = [...new Set(ruleIdsOf(["eslint", "house"]))];

    expect(beyondBaseline.sort()).toEqual(catalogued.sort());
  });

  it("카탈로그가 가리키는 테스트 파일은 자기 ruleId를 실제로 언급한다", () => {
    const withRuleId = RULES.filter((rule) => rule.ruleId !== null);
    const notMentioned = withRuleId.filter((rule) => {
      const content = readFileSync(
        path.join(process.cwd(), rule.test as string),
        "utf8",
      );
      return !content.includes(rule.ruleId as string);
    });

    expect(notMentioned).toEqual([]);
  });
});

describe("규칙 번호", () => {
  const numbers = [
    ...new Set([
      ...RULES.map((rule) => rule.no),
      ...RULE_NUMBERS_NEVER_ASSIGNED,
    ]),
  ].sort((a, b) => a - b);

  it("1부터 끝 번호까지 끊김 없이 이어진다", () => {
    const unbroken = Array.from(
      { length: ENFORCED_RULE_COUNT },
      (_, index) => index + 1,
    );

    expect(numbers).toEqual(unbroken);
  });

  it("정체를 못 찾은 번호는 여섯·일곱·여덟 셋뿐이다", () => {
    expect(RULE_NUMBERS_NEVER_ASSIGNED).toEqual([6, 7, 8]);
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
