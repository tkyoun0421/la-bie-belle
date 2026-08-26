import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  diffTokensAgainstCss,
  normalizeOklch,
  parseGlobalsCss,
  parseRoleTokenTable,
} from "@/shared/lib/token-css-parity";

const tokensMd = readFileSync(
  path.join(process.cwd(), "docs/design-system/tokens.md"),
  "utf8",
);
const globalsCss = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8",
);

describe("tokens.md 표 파싱", () => {
  it("백틱으로 감싼 토큰 이름 셀을 백틱 없이 읽는다", () => {
    const rows = parseRoleTokenTable(tokensMd);
    const bgNeutral = rows.find((row) => row.token === "bg.neutral");

    expect(bgNeutral).toBeDefined();
  });

  it("팔레트 열이 빈 자리(—)인 stroke.surface 행도 놓치지 않는다", () => {
    const rows = parseRoleTokenTable(tokensMd);
    const strokeSurface = rows.find((row) => row.token === "stroke.surface");

    expect(strokeSurface).toBeDefined();
    expect(strokeSurface?.palette).toBeNull();
  });

  it("Variant와 State가 결합된 토큰 이름을 하나의 항목으로 읽는다", () => {
    const rows = parseRoleTokenTable(tokensMd);
    const weakPressed = rows.find(
      (row) => row.token === "bg.neutral-weak-pressed",
    );

    expect(weakPressed).toBeDefined();
    expect(weakPressed?.palette).toBe("neutral-200");
  });
});

describe("globals.css 파싱", () => {
  const fixture = `:root {
  --palette-neutral-00: oklch(1 0 0);
  --palette-neutral-200: oklch(0.9 0 0);
  --role-bg-neutral: var(--palette-neutral-00);
  --role-stroke-neutral: var(--palette-neutral-200);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --palette-neutral-00: oklch(0.15 0 0);
    --palette-neutral-200: oklch(0.3 0 0);
  }
}

[data-theme="dark"] {
  --palette-neutral-00: oklch(0.15 0 0);
  --palette-neutral-200: oklch(0.3 0 0);
}
`;

  it(":root, 다크 미디어쿼리, data-theme 세 블록을 구분해서 읽는다", () => {
    const blocks = parseGlobalsCss(fixture);

    expect(blocks.light["--role-bg-neutral"]).toBeDefined();
    expect(blocks.darkMediaQuery["--role-bg-neutral"]).toBeDefined();
    expect(blocks.darkAttribute["--role-bg-neutral"]).toBeDefined();
  });

  it("--role- 변수가 --palette- 참조를 실제 값으로 풀어서 나오고, 라이트와 다크가 다르다", () => {
    const blocks = parseGlobalsCss(fixture);

    expect(blocks.light["--role-bg-neutral"]).toBe("oklch(1 0 0)");
    expect(blocks.darkAttribute["--role-bg-neutral"]).toBe("oklch(0.15 0 0)");
    expect(blocks.light["--role-bg-neutral"]).not.toBe(
      blocks.darkAttribute["--role-bg-neutral"],
    );
  });
});

describe("표기 정규화", () => {
  it("소수 자릿수가 달라도 같은 값이면 같다고 판정한다", () => {
    expect(normalizeOklch("oklch(1 0.0037 57)")).toBe(
      normalizeOklch("oklch(1.000 0.0037 57)"),
    );
  });

  it("실제 값이 다르면 다르다고 판정한다", () => {
    expect(normalizeOklch("oklch(1 0.0037 57)")).not.toBe(
      normalizeOklch("oklch(0.9 0.0037 57)"),
    );
  });
});

describe("불일치와 누락 진탐", () => {
  const brokenTokensMd = `### neutral

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | \`#FFFFFF\` | \`oklch(1 0 0)\` | \`#000000\` | \`oklch(0.15 0 0)\` |
| 100 | \`#EEEEEE\` | \`oklch(0.9 0 0)\` | \`#111111\` | \`oklch(0.2 0 0)\` |

### bg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`bg.neutral\` | neutral-00 | \`#FFFFFF\` | \`#000000\` | \`bg-bg-neutral\` |
`;

  it("팔레트 참조를 한 단계 바꾼 CSS 픽스처가 불일치로 판정된다", () => {
    const mismatchedCss = `:root {
  --palette-neutral-00: oklch(1 0 0);
  --palette-neutral-100: oklch(0.9 0 0);
  --role-bg-neutral: var(--palette-neutral-100);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --palette-neutral-00: oklch(0.15 0 0);
    --palette-neutral-100: oklch(0.2 0 0);
  }
}

[data-theme="dark"] {
  --palette-neutral-00: oklch(0.15 0 0);
  --palette-neutral-100: oklch(0.2 0 0);
}
`;

    const diff = diffTokensAgainstCss(brokenTokensMd, mismatchedCss);
    const bgNeutral = diff.find((entry) => entry.token === "bg.neutral");

    expect(bgNeutral?.status).toBe("mismatch");
  });

  it("--role-bg-neutral 정의를 지운 CSS 픽스처가 없음으로 판정된다", () => {
    const missingCss = `:root {
  --palette-neutral-00: oklch(1 0 0);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --palette-neutral-00: oklch(0.15 0 0);
  }
}

[data-theme="dark"] {
  --palette-neutral-00: oklch(0.15 0 0);
}
`;

    const diff = diffTokensAgainstCss(brokenTokensMd, missingCss);
    const bgNeutral = diff.find((entry) => entry.token === "bg.neutral");

    expect(bgNeutral?.status).toBe("missing");
  });
});

describe("실제 tokens.md와 globals.css 대조", () => {
  it("globals.css가 tokens.md 8절과 oklch 문자열로 맞물린다", () => {
    const diff = diffTokensAgainstCss(tokensMd, globalsCss);
    const notMatching = diff.filter((entry) => entry.status !== "match");

    expect(notMatching).toEqual([]);
  });
});
