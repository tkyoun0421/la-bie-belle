import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  tokenCssParity,
  type TokenDiffEntry,
} from "@tests/lint/token-css-parity";

const TOKENS_MD = `### neutral

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | \`#FFFFFF\` | \`oklch(1 0 0)\` | \`#000000\` | \`oklch(0.15 0 0)\` |
| 200 | \`#EEEEEE\` | \`oklch(0.9 0 0)\` | \`#111111\` | \`oklch(0.3 0 0)\` |

### bg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`bg.neutral\` | neutral-00 | \`#FFFFFF\` | \`#000000\` | \`bg-bg-neutral\` |
| \`bg.neutral-weak-pressed\` | neutral-200 | \`#EEEEEE\` | \`#111111\` | \`bg-bg-neutral-weak-pressed\` |

### stroke

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`stroke.surface\` | — | \`#FFFFFF\` | \`#000000\` | \`border-stroke-surface\` |
`;

const LIGHT_PALETTE = `  --palette-neutral-00: oklch(1 0 0);
  --palette-neutral-200: oklch(0.9 0 0);`;

const DARK_PALETTE = `    --palette-neutral-00: oklch(0.15 0 0);
    --palette-neutral-200: oklch(0.3 0 0);`;

const ROLES = `  --role-bg-neutral: var(--palette-neutral-00);
  --role-bg-neutral-weak-pressed: var(--palette-neutral-200);
  --role-stroke-surface: color-mix(in oklch, var(--palette-neutral-00) 50%, transparent);`;

function cssFixture(options: {
  root?: string;
  darkMediaQuery?: string;
  darkAttribute?: string;
}): string {
  return `:root {
${options.root ?? `${LIGHT_PALETTE}\n${ROLES}`}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${options.darkMediaQuery ?? DARK_PALETTE}
  }
}

[data-theme="dark"] {
${options.darkAttribute ?? DARK_PALETTE}
}
`;
}

function notMatching(diff: TokenDiffEntry[]) {
  return diff.filter(
    (entry) => entry.status !== "match" && entry.status !== "skipped",
  );
}

function entryOf(diff: TokenDiffEntry[], token: string): TokenDiffEntry {
  const entry = diff.find((item) => item.token === token);
  if (!entry) {
    throw new Error(`${token} 항목이 대조 결과에 없다.`);
  }
  return entry;
}

function mismatchesOf(diff: TokenDiffEntry[], token: string) {
  const entry = entryOf(diff, token);
  if (entry.status !== "mismatch") {
    throw new Error(`${token} 는 불일치가 아니라 ${entry.status} 로 나왔다.`);
  }
  return entry.mismatches;
}

function missingThemesOf(diff: TokenDiffEntry[], token: string) {
  const entry = entryOf(diff, token);
  if (entry.status !== "missing") {
    throw new Error(`${token} 는 누락이 아니라 ${entry.status} 로 나왔다.`);
  }
  return entry.themes;
}

describe("tokens.md 표 읽기", () => {
  it("백틱으로 감싼 토큰 이름 셀을 백틱 없이 읽는다", () => {
    const entry = entryOf(
      tokenCssParity(TOKENS_MD, cssFixture({})),
      "bg.neutral",
    );

    expect(entry.variable).toBe("--role-bg-neutral");
    expect(entry.status).toBe("match");
  });

  it("팔레트 열이 빈 자리(—)인 행은 값 대조를 건너뛴 것으로 표시된다", () => {
    const entry = entryOf(
      tokenCssParity(TOKENS_MD, cssFixture({})),
      "stroke.surface",
    );

    expect(entry.variable).toBe("--role-stroke-surface");
    expect(entry.status).toBe("skipped");
  });

  it("Variant와 State가 붙은 토큰 이름을 하나의 항목으로 읽는다", () => {
    const entry = entryOf(
      tokenCssParity(TOKENS_MD, cssFixture({})),
      "bg.neutral-weak-pressed",
    );

    expect(entry.variable).toBe("--role-bg-neutral-weak-pressed");
    expect(entry.status).toBe("match");
  });

  it("Variant와 State가 붙은 토큰도 자기 행의 팔레트 단계로 대조된다", () => {
    const wrongStep = `${LIGHT_PALETTE}
  --role-bg-neutral: var(--palette-neutral-00);
  --role-bg-neutral-weak-pressed: var(--palette-neutral-00);
  --role-stroke-surface: oklch(1 0 0);`;

    const mismatches = mismatchesOf(
      tokenCssParity(TOKENS_MD, cssFixture({ root: wrongStep })),
      "bg.neutral-weak-pressed",
    );

    expect(mismatches.map((item) => item.theme)).toEqual([
      "light",
      "darkMediaQuery",
      "darkAttribute",
    ]);
  });
});

describe("globals.css 세 블록 구분", () => {
  it("--role- 이 가리키는 --palette- 참조를 테마마다 다른 값으로 푼다", () => {
    const diff = tokenCssParity(TOKENS_MD, cssFixture({}));

    expect(notMatching(diff)).toEqual([]);
  });

  it("역할 변수를 리터럴로 박으면 다크 두 블록이 라이트 값을 물려받아 어긋난다", () => {
    const literalRoles = `${LIGHT_PALETTE}
  --role-bg-neutral: oklch(1 0 0);
  --role-bg-neutral-weak-pressed: var(--palette-neutral-200);
  --role-stroke-surface: oklch(1 0 0);`;

    const mismatches = mismatchesOf(
      tokenCssParity(TOKENS_MD, cssFixture({ root: literalRoles })),
      "bg.neutral",
    );

    expect(mismatches.map((item) => item.theme)).toEqual([
      "darkMediaQuery",
      "darkAttribute",
    ]);
    expect(mismatches[0]).toMatchObject({
      expected: "oklch(0.15 0 0)",
      actual: "oklch(1 0 0)",
    });
  });

  it("다크 미디어쿼리 블록만 어긋나면 그 테마만 불일치로 잡는다", () => {
    const brokenMediaQuery = `    --palette-neutral-00: oklch(0.2 0 0);
    --palette-neutral-200: oklch(0.3 0 0);`;

    const mismatches = mismatchesOf(
      tokenCssParity(
        TOKENS_MD,
        cssFixture({ darkMediaQuery: brokenMediaQuery }),
      ),
      "bg.neutral",
    );

    expect(mismatches.map((item) => item.theme)).toEqual(["darkMediaQuery"]);
  });

  it("[data-theme] 블록만 어긋나면 그 테마만 불일치로 잡는다", () => {
    const brokenAttribute = `    --palette-neutral-00: oklch(0.2 0 0);
    --palette-neutral-200: oklch(0.3 0 0);`;

    const mismatches = mismatchesOf(
      tokenCssParity(TOKENS_MD, cssFixture({ darkAttribute: brokenAttribute })),
      "bg.neutral",
    );

    expect(mismatches.map((item) => item.theme)).toEqual(["darkAttribute"]);
  });
});

describe("oklch 표기 정규화", () => {
  it("소수 자릿수만 다르면 같은 값으로 판정한다", () => {
    const paddedLight = `  --palette-neutral-00: oklch(1.000 0 0);
  --palette-neutral-200: oklch(0.900 0 0);
${ROLES}`;

    const diff = tokenCssParity(TOKENS_MD, cssFixture({ root: paddedLight }));

    expect(notMatching(diff)).toEqual([]);
  });

  it("값이 실제로 다르면 불일치로 판정한다", () => {
    const shiftedLight = `  --palette-neutral-00: oklch(0.9 0 0);
  --palette-neutral-200: oklch(0.9 0 0);
${ROLES}`;

    const mismatches = mismatchesOf(
      tokenCssParity(TOKENS_MD, cssFixture({ root: shiftedLight })),
      "bg.neutral",
    );

    expect(mismatches.map((item) => item.theme)).toEqual(["light"]);
  });
});

describe("역할 변수 누락", () => {
  it("정의가 아예 없으면 세 테마 모두 누락으로 잡는다", () => {
    const withoutBgNeutral = `${LIGHT_PALETTE}
  --role-bg-neutral-weak-pressed: var(--palette-neutral-200);
  --role-stroke-surface: oklch(1 0 0);`;

    const themes = missingThemesOf(
      tokenCssParity(TOKENS_MD, cssFixture({ root: withoutBgNeutral })),
      "bg.neutral",
    );

    expect(themes).toEqual(["light", "darkMediaQuery", "darkAttribute"]);
  });

  it("[data-theme] 블록에만 정의하면 라이트와 다크 미디어쿼리가 누락으로 잡힌다", () => {
    const withoutBgNeutral = `${LIGHT_PALETTE}
  --role-bg-neutral-weak-pressed: var(--palette-neutral-200);
  --role-stroke-surface: oklch(1 0 0);`;
    const attributeOnly = `${DARK_PALETTE}
    --role-bg-neutral: var(--palette-neutral-00);`;

    const themes = missingThemesOf(
      tokenCssParity(
        TOKENS_MD,
        cssFixture({ root: withoutBgNeutral, darkAttribute: attributeOnly }),
      ),
      "bg.neutral",
    );

    expect(themes).toEqual(["light", "darkMediaQuery"]);
  });
});

const ROLE_TOKEN_COUNT = 27;

const PALETTE_LESS_TOKENS = ["stroke.surface"];

function realEntries() {
  const markdown = readFileSync(
    path.join(process.cwd(), "docs/design-system/tokens.md"),
    "utf8",
  );
  const css = readFileSync(
    path.join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );

  return tokenCssParity(markdown, css);
}

describe("실제 tokens.md와 globals.css 대조", () => {
  it("tokens.md의 역할 토큰 표에서 스물일곱 행을 읽는다", () => {
    expect(realEntries()).toHaveLength(ROLE_TOKEN_COUNT);
  });

  it("팔레트를 가리키지 않아 값 대조를 건너뛰는 토큰은 stroke.surface 하나뿐이다", () => {
    const skipped = realEntries()
      .filter((entry) => entry.status === "skipped")
      .map((entry) => entry.token);

    expect(skipped).toEqual(PALETTE_LESS_TOKENS);
  });

  it("globals.css가 tokens.md 8절과 oklch 문자열로 맞물린다", () => {
    expect(notMatching(realEntries())).toEqual([]);
  });
});
