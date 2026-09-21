import { readFileSync } from "node:fs";
import path from "node:path";
import { generateGlobalsCss } from "@scripts/generate-globals-css.mts";
import { format } from "prettier";
import { beforeAll, describe, expect, it } from "vitest";

const SKELETON_FENCE = `@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";

:root {
  font-size: 16px;
}`;

const THEME_RESET_FENCE = `  --text-4xl: initial;
  --text-5xl: initial;
  --text-6xl: initial;
  --text-7xl: initial;
  --text-8xl: initial;
  --text-9xl: initial;

  --font-weight-thin: initial;
  --font-weight-extralight: initial;
  --font-weight-light: initial;
  --font-weight-extrabold: initial;
  --font-weight-black: initial;

  --radius-2xl: initial;
  --radius-3xl: initial;
  --radius-4xl: initial;`;

const THEME_INLINE_HEADER_FENCE = `  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;

  --font-sans: "WantedSans-Regular";
  --font-medium: "WantedSans-Medium";
  --font-semibold: "WantedSans-SemiBold";
  --font-bold: "WantedSans-Bold";`;

const CSS_FULL_SECTION = `## 8. CSS 전문

### 8.1 뼈대

\`\`\`css
${SKELETON_FENCE}
\`\`\`

### 8.2 Tailwind 기본값 초기화와 서체

\`\`\`css
${THEME_RESET_FENCE}
\`\`\`

\`\`\`css
${THEME_INLINE_HEADER_FENCE}
\`\`\`
`;

function neutralTable(neutral00LightOklch = "oklch(1 0.004 90)"): string {
  return `### neutral

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | \`#FFFFFF\` | \`${neutral00LightOklch}\` | \`#262626\` | \`oklch(0.15 0.004 90)\` |
| 100 | \`#EEEEEE\` | \`oklch(0.9 0.004 90)\` | \`#333333\` | \`oklch(0.2 0.004 90)\` |
| 200 | \`#DDDDDD\` | \`oklch(0.8 0.004 90)\` | \`#404040\` | \`oklch(0.25 0.004 90)\` |
`;
}

const BRAND_TABLE = `### brand

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | \`#FFF6F0\` | \`oklch(0.99 0.05 30)\` | \`#1A1008\` | \`oklch(0.12 0.05 30)\` |
| 100 | \`#F3D9C2\` | \`oklch(0.88 0.05 30)\` | \`#3A2416\` | \`oklch(0.22 0.05 30)\` |
`;

function paletteSection(neutral00LightOklch?: string): string {
  return `## 1. 팔레트

${neutralTable(neutral00LightOklch)}
${BRAND_TABLE}`;
}

const ROLE_TOKEN_SECTION = `## 2. 역할 토큰

### bg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`bg.neutral\` | neutral-00 | \`#FFFFFF\` | \`#262626\` | \`bg-bg-neutral\` |
| \`bg.brand-solid\` | brand-100 | \`#F3D9C2\` | \`#3A2416\` | \`bg-bg-brand-solid\` |
| \`bg.scrim\` | — | \`#1B19176B\` | \`#0D0C0B6B\` | \`bg-bg-scrim\` |

### fg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`fg.neutral\` | neutral-200 | \`#DDDDDD\` | \`#404040\` | \`text-fg-neutral\` |

### stroke

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| \`stroke.neutral\` | neutral-100 | \`#EEEEEE\` | \`#333333\` | \`border-stroke-neutral\` |
| \`stroke.surface\` | — | \`transparent\` | neutral-200 | \`border-stroke-surface\` |
`;

const TYPOGRAPHY_SECTION = `## 3. 타이포그래피

| 유틸 | 크기 | 행간 | rem 크기 | rem 행간 | 용도 |
| --- | --- | --- | --- | --- | --- |
| \`text-sm\` | 15px | 22.5px | 0.9375 | 1.40625 | 작은 본문 |
| \`text-base\` | 17px | 25.5px | 1.0625 | 1.59375 | 일반 본문 |
`;

const ROUNDING_SECTION = `## 5. 라운딩

| 유틸 | 값 | 쓰는 자리 |
| --- | --- | --- |
| \`rounded-md\` | 12px | 입력 |
`;

const MOTION_SECTION = `## 6. 모션

| 변수 | 값 | Tailwind 유틸 | 쓰는 자리 |
| --- | --- | --- | --- |
| \`--duration-fast\` | 125ms | \`duration-125\` | 툴팁, 아주 작은 상태 변화 |

### 되풀이 주기와 계단

| 변수 | 값 | 쓰는 자리 |
| --- | --- | --- |
| \`--interval-rotate\` | 4s | 문구가 저절로 갈리는 주기 |
| \`--stagger-step\` | 70ms | 등장할 때 요소끼리 어긋나는 간격 |
`;

const VENDOR_SECTION = `## 9. 바깥이 정한 값

| 변수 | 값 | 자리 | Tailwind 유틸 |
| --- | --- | --- | --- |
| \`--vendor-google-bg\` | \`#131314\` | 버튼 배경 | \`bg-google-bg\` |
`;

type FixtureOverrides = {
  palette?: string;
  roleTokens?: string;
  typography?: string;
  rounding?: string;
  motion?: string;
  cssFull?: string;
  vendor?: string;
};

function tokensMdFixture(overrides: FixtureOverrides = {}): string {
  return [
    overrides.palette ?? paletteSection(),
    overrides.roleTokens ?? ROLE_TOKEN_SECTION,
    overrides.typography ?? TYPOGRAPHY_SECTION,
    overrides.rounding ?? ROUNDING_SECTION,
    overrides.motion ?? MOTION_SECTION,
    overrides.cssFull ?? CSS_FULL_SECTION,
    overrides.vendor ?? VENDOR_SECTION,
  ].join("\n\n---\n\n");
}

function matchBrace(source: string, open: number): number {
  let depth = 0;
  for (let cursor = open; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") {
      depth += 1;
    } else if (source[cursor] === "}") {
      depth -= 1;
      if (depth === 0) {
        return cursor;
      }
    }
  }
  return source.length;
}

function topLevelBlocks(source: string): { selector: string; body: string }[] {
  const blocks: { selector: string; body: string }[] = [];
  let head = "";
  let cursor = 0;

  while (cursor < source.length) {
    const character = source[cursor];
    if (character === "{") {
      const close = matchBrace(source, cursor);
      blocks.push({
        selector: head.trim(),
        body: source.slice(cursor + 1, close),
      });
      head = "";
      cursor = close + 1;
      continue;
    }
    if (character === ";") {
      head = "";
      cursor += 1;
      continue;
    }
    head += character;
    cursor += 1;
  }

  return blocks;
}

function topLevelDeclarationMap(body: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  let depth = 0;
  let buffer = "";

  for (let cursor = 0; cursor < body.length; cursor += 1) {
    const character = body[cursor];
    if (character === "{") {
      depth += 1;
      buffer = "";
      continue;
    }
    if (character === "}") {
      depth -= 1;
      buffer = "";
      continue;
    }
    if (depth > 0) {
      continue;
    }
    if (character === ";") {
      const separator = buffer.indexOf(":");
      if (separator !== -1) {
        const name = buffer.slice(0, separator).trim();
        if (name.startsWith("--")) {
          declarations[name] = buffer
            .slice(separator + 1)
            .trim()
            .replace(/\s+/g, " ");
        }
      }
      buffer = "";
      continue;
    }
    buffer += character;
  }

  return declarations;
}

function requireBlock(
  css: string,
  matches: (selector: string) => boolean,
  description: string,
): { selector: string; body: string } {
  const block = topLevelBlocks(css).find((candidate) =>
    matches(candidate.selector),
  );
  if (!block) {
    throw new Error(`${description} 블록을 생성 결과에서 찾지 못했다.`);
  }
  return block;
}

function lightBody(css: string): string {
  return topLevelBlocks(css)
    .filter((block) => block.selector === ":root")
    .map((block) => block.body)
    .join("\n");
}

function darkMediaBody(css: string): string {
  const media = requireBlock(
    css,
    (selector) =>
      /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)$/.test(selector),
    "다크 미디어쿼리",
  );
  const nested = topLevelBlocks(media.body).find(
    (block) => block.selector === ":root",
  );
  if (!nested) {
    throw new Error(":root 블록을 다크 미디어쿼리 안에서 찾지 못했다.");
  }
  return nested.body;
}

function requireDeclaration(body: string, name: string): string {
  const value = topLevelDeclarationMap(body)[name];
  if (value === undefined) {
    throw new Error(`${name} 선언을 생성 결과에서 찾지 못했다.`);
  }
  return value;
}

function allTopLevelDeclarationMap(body: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  let depth = 0;
  let buffer = "";

  for (let cursor = 0; cursor < body.length; cursor += 1) {
    const character = body[cursor];
    if (character === "{") {
      depth += 1;
      buffer = "";
      continue;
    }
    if (character === "}") {
      depth -= 1;
      buffer = "";
      continue;
    }
    if (depth > 0) {
      continue;
    }
    if (character === ";") {
      const separator = buffer.indexOf(":");
      if (separator !== -1) {
        const name = buffer.slice(0, separator).trim();
        declarations[name] = buffer
          .slice(separator + 1)
          .trim()
          .replace(/\s+/g, " ");
      }
      buffer = "";
      continue;
    }
    buffer += character;
  }

  return declarations;
}

function requirePlainDeclaration(body: string, name: string): string {
  const value = allTopLevelDeclarationMap(body)[name];
  if (value === undefined) {
    throw new Error(`${name} 선언을 생성 결과에서 찾지 못했다.`);
  }
  return value;
}

function declarationValueAnywhere(css: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escaped}:\\s*([^;]+);`);
  const match = pattern.exec(css);
  if (!match) {
    throw new Error(`${name} 선언을 생성 결과 어디에서도 찾지 못했다.`);
  }
  return match[1].trim().replace(/\s+/g, " ");
}

function requiredIndexOf(text: string, needle: string): number {
  const index = text.indexOf(needle);
  if (index === -1) {
    throw new Error(`"${needle}" 를 생성 결과에서 찾지 못했다.`);
  }
  return index;
}

describe("리스크 A — 팔레트 행이 빠지거나 계열이 섞인다", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it.each([
    ["neutral", "00", "oklch(1 0.004 90)", "oklch(0.15 0.004 90)"],
    ["neutral", "100", "oklch(0.9 0.004 90)", "oklch(0.2 0.004 90)"],
    ["neutral", "200", "oklch(0.8 0.004 90)", "oklch(0.25 0.004 90)"],
    ["brand", "00", "oklch(0.99 0.05 30)", "oklch(0.12 0.05 30)"],
    ["brand", "100", "oklch(0.88 0.05 30)", "oklch(0.22 0.05 30)"],
  ])(
    "%s-%s 단계는 라이트 %s, 다크 %s 값을 자기 계열에서만 가져온다",
    (series, step, light, dark) => {
      const variable = `--palette-${series}-${step}`;

      expect(requireDeclaration(lightBody(css), variable)).toBe(light);
      expect(requireDeclaration(darkMediaBody(css), variable)).toBe(dark);
    },
  );
});

describe("리스크 B — oklch 표기를 정규화하지 않는다", () => {
  it("표의 소수 세 자리 oklch를 globals.css 표기(불필요한 0 없이)로 바꾼다", async () => {
    const paddedPalette = paletteSection("oklch(1.000 0.0040 90)");
    const css = await generateGlobalsCss(
      tokensMdFixture({ palette: paddedPalette }),
    );

    expect(requireDeclaration(lightBody(css), "--palette-neutral-00")).toBe(
      "oklch(1 0.004 90)",
    );
  });
});

describe("리스크 C — 팔레트 칸이 — 인 특수 행", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it("라이트에서 stroke.surface는 투명이다", () => {
    expect(requireDeclaration(lightBody(css), "--surface-stroke")).toBe(
      "transparent",
    );
  });

  it("다크 미디어쿼리 블록에서 stroke.surface는 다크 칸의 단계 이름을 팔레트 변수로 푼다", () => {
    expect(requireDeclaration(darkMediaBody(css), "--surface-stroke")).toBe(
      "var(--palette-neutral-200)",
    );
  });

  it("stroke.surface 역할 토큰은 팔레트가 아니라 surface-stroke 변수를 가리킨다", () => {
    expect(declarationValueAnywhere(css, "--role-stroke-surface")).toBe(
      "var(--surface-stroke)",
    );
  });
});

describe("리스크 J — 팔레트 칸이 — 인 행이 여럿이고 칸 종류가 섞인다", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it.each([
    ["라이트", lightBody],
    ["다크 미디어쿼리", darkMediaBody],
  ])(
    "%s 블록에 bg.scrim과 stroke.surface가 둘 다 선다 — 한 행만 받고 멈추지 않는다",
    (_label, bodyOf) => {
      const declarations = topLevelDeclarationMap(bodyOf(css));

      expect(Object.keys(declarations)).toEqual(
        expect.arrayContaining(["--scrim-bg", "--surface-stroke"]),
      );
    },
  );

  it("색 리터럴 칸은 팔레트를 안 거치고 값 그대로 박힌다", () => {
    expect(requireDeclaration(lightBody(css), "--scrim-bg")).toBe("#1b19176b");
    expect(requireDeclaration(darkMediaBody(css), "--scrim-bg")).toBe(
      "#0d0c0b6b",
    );
  });

  it("한 행 안에서 라이트가 리터럴이고 다크가 단계 이름이어도 각 칸을 따로 읽는다", () => {
    expect(requireDeclaration(lightBody(css), "--surface-stroke")).toBe(
      "transparent",
    );
    expect(requireDeclaration(darkMediaBody(css), "--surface-stroke")).toBe(
      "var(--palette-neutral-200)",
    );
  });

  it("bg.scrim 역할 토큰은 팔레트가 아니라 scrim-bg 변수를 가리킨다", () => {
    expect(declarationValueAnywhere(css, "--role-bg-scrim")).toBe(
      "var(--scrim-bg)",
    );
  });
});

describe("리스크 E — 순서가 바뀌면 diff가 난다", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it("팔레트 계열 순서가 표에 적은 순서(neutral, brand)를 따른다", () => {
    const body = lightBody(css);

    expect(requiredIndexOf(body, "--palette-neutral-00:")).toBeLessThan(
      requiredIndexOf(body, "--palette-brand-00:"),
    );
  });

  it("팔레트 단계 순서가 표에 적은 순서(00, 100, 200)를 따른다", () => {
    const body = lightBody(css);
    const at00 = requiredIndexOf(body, "--palette-neutral-00:");
    const at100 = requiredIndexOf(body, "--palette-neutral-100:");
    const at200 = requiredIndexOf(body, "--palette-neutral-200:");

    expect(at00).toBeLessThan(at100);
    expect(at100).toBeLessThan(at200);
  });

  it("역할 토큰 순서가 표의 bg, fg, stroke 절 순서를 따른다", () => {
    const atBg = requiredIndexOf(css, "--role-bg-neutral:");
    const atFg = requiredIndexOf(css, "--role-fg-neutral:");
    const atStroke = requiredIndexOf(css, "--role-stroke-neutral:");

    expect(atBg).toBeLessThan(atFg);
    expect(atFg).toBeLessThan(atStroke);
  });
});

describe("리스크 F — 8절 고정 블록을 잘못 잘라 붙인다", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it.each([
    ["8.1 뼈대(import 넷과 :root font-size)", SKELETON_FENCE],
    ["8.2 Tailwind 기본값 초기화", THEME_RESET_FENCE],
    ["8.2 @theme inline 머리(서체 넷)", THEME_INLINE_HEADER_FENCE],
  ])("%s 코드펜스가 잘리거나 빠지지 않고 그대로 들어간다", (_label, fence) => {
    expect(css).toContain(fence);
  });
});

describe("리스크 G — 표마다 다른 컬럼 인덱스를 혼동한다", () => {
  let css: string;

  beforeAll(async () => {
    css = await generateGlobalsCss(tokensMdFixture());
  });

  it("모션 표에서 Tailwind 유틸 열이나 쓰는 자리 열이 아니라 값 열을 duration에 쓴다", () => {
    expect(declarationValueAnywhere(css, "--duration-fast")).toBe("125ms");
  });

  it("되풀이 주기 표는 열이 셋 뿐인데 값 열을 정확히 짚는다", () => {
    expect(declarationValueAnywhere(css, "--interval-rotate")).toBe("4s");
  });

  it("요소 간격 표에서도 값 열을 정확히 짚는다", () => {
    expect(declarationValueAnywhere(css, "--stagger-step")).toBe("70ms");
  });

  it("9절 바깥 값 표는 자리 열과 Tailwind 유틸 열의 순서가 모션 표와 반대다", () => {
    expect(declarationValueAnywhere(css, "--vendor-google-bg")).toBe("#131314");
  });
});

describe("리스크 H — prettier 포맷과 어긋난 출력을 저장한다", () => {
  it("생성한 CSS를 다시 prettier로 포맷해도 결과가 바뀌지 않는다", async () => {
    const css = await generateGlobalsCss(tokensMdFixture());
    const reformatted = await format(css, { parser: "css" });

    expect(reformatted).toBe(css);
  });
});

describe("리스크 I — 생성기가 비결정적이다", () => {
  it("같은 입력을 두 번 돌려도 바이트 단위로 같은 문자열이 나온다", async () => {
    const markdown = tokensMdFixture();

    const first = await generateGlobalsCss(markdown);
    const second = await generateGlobalsCss(markdown);

    expect(second).toBe(first);
  });
});

describe("리스크 K — :root의 font-size가 생성물에서 사라진다", () => {
  it("8.1 뼈대 펜스의 font-size 선언이 :root에 그대로 살아남는다", async () => {
    const css = await generateGlobalsCss(tokensMdFixture());

    expect(requirePlainDeclaration(lightBody(css), "font-size")).toBe("16px");
  });
});

describe("리스크 L — data-theme 선택자가 생성물에 남는다", () => {
  it("생성물 어디에도 data-theme 선택자가 없다", async () => {
    const css = await generateGlobalsCss(tokensMdFixture());

    expect(css).not.toMatch(/data-theme/);
  });
});

describe("리스크 M — shadcn 다리와 베이스 레이어가 생성물에 남는다", () => {
  it("생성물 어디에도 @layer base가 없다", async () => {
    const css = await generateGlobalsCss(tokensMdFixture());

    expect(css).not.toMatch(/@layer\s+base/);
  });

  it.each(["--color-primary", "--color-muted-foreground"])(
    "생성물 어디에도 shadcn 이름 %s가 없다",
    async (name) => {
      const css = await generateGlobalsCss(tokensMdFixture());

      expect(css).not.toContain(`${name}:`);
    },
  );
});

describe("완료 조건 — 실제 tokens.md에서 실제 globals.css를 그대로 만든다", () => {
  it("tokens.md로 생성한 결과가 저장된 globals.css와 바이트 단위로 같다", async () => {
    const markdown = readFileSync(
      path.join(process.cwd(), "docs/2-design/design-system/tokens.md"),
      "utf8",
    );
    const savedCss = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    const generated = await generateGlobalsCss(markdown);

    expect(generated).toBe(savedCss);
  });
});
