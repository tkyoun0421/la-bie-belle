import {
  MOTION_PAIRS,
  motionTokenViolations,
  repositoryMotionTokenViolations,
} from "@tests/lint/motionTokens";

type ConstantOverrides = Partial<{
  riseDuration: string;
  riseStagger: string;
  riseDistance: string;
  fastDuration: string;
  pressScale: string;
  shimmerInterval: string;
}>;

type TokenOverrides = Partial<{
  slower: string;
  stagger: string;
  distance: string;
  fast: string;
  press: string;
  shimmer: string;
}>;

function constantsSource(overrides: ConstantOverrides = {}): string {
  return [
    `export const RISE_DURATION_MS = ${overrides.riseDuration ?? "300"};`,
    `export const RISE_STAGGER_MS = ${overrides.riseStagger ?? "70"};`,
    `export const RISE_DISTANCE = ${overrides.riseDistance ?? "8"};`,
    `export const DURATION_FAST_MS = ${overrides.fastDuration ?? "125"};`,
    `export const PRESS_SCALE = ${overrides.pressScale ?? "0.97"};`,
    `export const SHIMMER_INTERVAL_MS = ${overrides.shimmerInterval ?? "1600"};`,
  ].join("\n");
}

function tokensMarkdown(overrides: TokenOverrides = {}): string {
  return [
    "| 변수 | 값 | Tailwind 유틸 | 쓰는 자리 |",
    "| --- | --- | --- | --- |",
    `| \`--duration-fast\` | ${overrides.fast ?? "125ms"} | \`duration-125\` | 툴팁 |`,
    `| \`--duration-slower\` | ${overrides.slower ?? "300ms"} | \`duration-300\` | 화면 전환 |`,
    "",
    "| 자리 | 값 |",
    "| --- | --- |",
    `| 버튼 눌림 | \`scale(${overrides.press ?? "0.97"})\` |`,
    "",
    "| 변수 | 값 | 쓰는 자리 |",
    "| --- | --- | --- |",
    `| \`--stagger-step\` | ${overrides.stagger ?? "70ms"} | 등장할 때 요소끼리 어긋나는 간격 |`,
    `| \`--rise-distance\` | ${overrides.distance ?? "8px"} | 등장할 때 아래에서 올라오는 거리 |`,
    `| \`--interval-shimmer\` | ${overrides.shimmer ?? "1.6s"} | 스켈레톤 위로 빛이 한 번 지나가는 주기 |`,
  ].join("\n");
}

function withoutLine(text: string, needle: string): string {
  return text
    .split("\n")
    .filter((line) => !line.includes(needle))
    .join("\n");
}

describe("모션 상수와 tokens.md의 대조 목록", () => {
  it("짝은 정확히 여섯이다", () => {
    expect(
      MOTION_PAIRS.map((pair: { tsExportName: string }) => pair.tsExportName),
    ).toEqual([
      "RISE_DURATION_MS",
      "RISE_STAGGER_MS",
      "RISE_DISTANCE",
      "DURATION_FAST_MS",
      "PRESS_SCALE",
      "SHIMMER_INTERVAL_MS",
    ]);
  });
});

describe("모션 상수 양방향 대조 — 값으로만 본다", () => {
  it("여섯 값이 같으면 위반이 없다", () => {
    expect(motionTokenViolations(constantsSource(), tokensMarkdown())).toEqual(
      [],
    );
  });

  it("등장 시간 토큰을 320ms로 바꾸면 상수 이름과 기대와 실제를 담은 위반 하나다", () => {
    const violations = motionTokenViolations(
      constantsSource(),
      tokensMarkdown({ slower: "320ms" }),
    );

    expect(violations).toEqual([
      {
        tsExportName: "RISE_DURATION_MS",
        kind: "mismatch",
        expected: 320,
        actual: 300,
      },
    ]);
  });

  it("TS 빠른 시간이 130ms면 tokens.md의 125ms와 안 맞아 위반이다", () => {
    const violations = motionTokenViolations(
      constantsSource({ fastDuration: "130" }),
      tokensMarkdown(),
    );

    expect(violations).toEqual([
      {
        tsExportName: "DURATION_FAST_MS",
        kind: "mismatch",
        expected: 125,
        actual: 130,
      },
    ]);
  });

  it("TS 눌림 스케일이 0.95면 tokens.md의 0.97과 안 맞아 위반이다", () => {
    const violations = motionTokenViolations(
      constantsSource({ pressScale: "0.95" }),
      tokensMarkdown(),
    );

    expect(violations).toEqual([
      {
        tsExportName: "PRESS_SCALE",
        kind: "mismatch",
        expected: 0.97,
        actual: 0.95,
      },
    ]);
  });

  it("shimmer 주기 토큰을 2s로 바꾸면 상수 1600ms와 안 맞아 위반이다", () => {
    const violations = motionTokenViolations(
      constantsSource(),
      tokensMarkdown({ shimmer: "2s" }),
    );

    expect(violations).toEqual([
      {
        tsExportName: "SHIMMER_INTERVAL_MS",
        kind: "mismatch",
        expected: 2000,
        actual: 1600,
      },
    ]);
  });

  it("1.6s와 1600ms는 같은 값이다", () => {
    expect(
      motionTokenViolations(
        constantsSource(),
        tokensMarkdown({ shimmer: "1600ms" }),
      ),
    ).toEqual([]);
  });

  it("0.3s와 300ms는 같은 값이다", () => {
    expect(
      motionTokenViolations(
        constantsSource(),
        tokensMarkdown({ slower: "0.3s" }),
      ),
    ).toEqual([]);
  });

  it("TS에 상수가 없으면 missing-from-constants다", () => {
    const violations = motionTokenViolations(
      withoutLine(constantsSource(), "RISE_DISTANCE"),
      tokensMarkdown(),
    );

    expect(violations).toEqual([
      { tsExportName: "RISE_DISTANCE", kind: "missing-from-constants" },
    ]);
  });

  it("tokens.md에 행이 없으면 missing-from-tokens다", () => {
    const violations = motionTokenViolations(
      constantsSource(),
      withoutLine(tokensMarkdown(), "--rise-distance"),
    );

    expect(violations).toEqual([
      { tsExportName: "RISE_DISTANCE", kind: "missing-from-tokens" },
    ]);
  });

  it("TS 파일 자체가 없으면 여섯 모두 missing-from-constants다", () => {
    const violations = motionTokenViolations(null, tokensMarkdown());

    expect(violations).toHaveLength(6);
    expect(
      violations.every(
        (violation: { kind: string }) =>
          violation.kind === "missing-from-constants",
      ),
    ).toBe(true);
  });
});

describe("모션 상수 대조 — 실제 저장소 회귀", () => {
  it("motion.const.ts와 tokens.md가 서로 맞는다", () => {
    expect(repositoryMotionTokenViolations(process.cwd())).toEqual([]);
  });
});
