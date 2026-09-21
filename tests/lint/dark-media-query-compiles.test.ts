import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const GLOBALS_CSS_PATH = path.join(process.cwd(), "src/app/globals.css");
const FIXTURE_UTILITY = "dark:border-stroke-neutral";
const FIXTURE_CLASS_SELECTOR = ".dark\\:border-stroke-neutral";
const SYSTEM_DARK_MEDIA = /prefers-color-scheme:\s*dark/;
const DARK_ATTRIBUTE_SELECTOR = /\[data-theme=["']dark["']\]/;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostcssNode = any;

function tailwindPostcssProcessor() {
  const projectRequire = createRequire(
    path.join(process.cwd(), "package.json"),
  );
  const pluginEntry = projectRequire.resolve("@tailwindcss/postcss");
  const pluginRequire = createRequire(pluginEntry);
  const postcss = pluginRequire("postcss");
  const tailwindcss = projectRequire("@tailwindcss/postcss");

  return postcss([tailwindcss()]);
}

function plainPostcssProcessor() {
  const projectRequire = createRequire(
    path.join(process.cwd(), "package.json"),
  );
  const postcss = projectRequire("postcss");

  return postcss();
}

function darkVariantFixture(): string {
  const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf8");

  return `${globalsCss}\n\n@source inline("${FIXTURE_UTILITY}");\n`;
}

/**
 * Tailwind v4는 `dark:border-stroke-neutral`을 평평한(flat) 선택자로 펴지 않고,
 * 클래스 선택자 규칙 안에 `@media (...)`를 중첩해 넣는다:
 *   .dark\:border-stroke-neutral { @media (prefers-color-scheme: dark) { border-color: ...; } }
 * 그래서 클래스 선택자와 정확히 같은 규칙을 먼저 찾고, 그 규칙의 "직계 자식"으로
 * 다크 미디어 쿼리가 있는지를 봐야 한다 — 조상 방향이 아니라 자손 방향이다.
 */
function fixtureUtilityDarkMedia(root: {
  walkRules: (callback: (rule: PostcssNode) => void) => void;
}): PostcssNode | undefined {
  let found: PostcssNode | undefined;

  root.walkRules((rule) => {
    if (rule.selector !== FIXTURE_CLASS_SELECTOR) {
      return;
    }
    const media = rule.nodes.find(
      (node: PostcssNode) =>
        node.type === "atrule" &&
        node.name === "media" &&
        SYSTEM_DARK_MEDIA.test(node.params),
    );
    if (media) {
      found = media;
    }
  });

  return found;
}

/**
 * 실제 globals.css 파일 그대로를 일반 CSS로 파싱한다. Tailwind 플러그인을 거치지
 * 않으므로 `@import`를 못 푸는 상황과 무관하게 읽을 수 있다. `root.nodes`의 최상위
 * 항목만 보는 것은 다크 팔레트 블록이 최상위 하나여야 한다는 것이 여기서 재는
 * 대상이라서다 — 재귀로 훑으면 유틸 규칙 안에 중첩된 미디어 쿼리까지 같이 걸린다.
 */
function topLevelDarkMediaRules(root: { nodes: PostcssNode[] }): PostcssNode[] {
  const media = root.nodes.filter(
    (node) =>
      node.type === "atrule" &&
      node.name === "media" &&
      SYSTEM_DARK_MEDIA.test(node.params),
  );

  const nested: PostcssNode[] = [];
  for (const atRule of media) {
    atRule.walkRules((rule: PostcssNode) => nested.push(rule));
  }
  return nested;
}

function topLevelDarkAttributeRules(root: { nodes: PostcssNode[] }): string[] {
  return root.nodes
    .filter(
      (node) =>
        node.type === "rule" &&
        typeof node.selector === "string" &&
        DARK_ATTRIBUTE_SELECTOR.test(node.selector),
    )
    .map((node) => node.selector);
}

function topLevelLightDeclaration(
  root: { nodes: PostcssNode[] },
  prop: string,
): string | undefined {
  let found: string | undefined;

  for (const node of root.nodes) {
    if (node.type === "rule" && node.selector === ":root") {
      node.walkDecls(prop, (decl: PostcssNode) => {
        found = decl.value;
      });
    }
  }

  return found;
}

describe("dark: 유틸이 시스템 미디어 쿼리로 컴파일되는가", () => {
  let darkMedia: PostcssNode | undefined;

  beforeAll(async () => {
    const processor = tailwindPostcssProcessor();
    const result = await processor.process(darkVariantFixture(), {
      from: GLOBALS_CSS_PATH,
    });

    darkMedia = fixtureUtilityDarkMedia(result.root);
  });

  it("dark: 유틸이 @media (prefers-color-scheme: dark) 갈래로 컴파일된다", () => {
    expect(darkMedia).toBeDefined();
  });

  it("그 갈래 안에 선언이 곧바로 온다 — data-theme 조건을 거는 @custom-variant dark를 더 쓰지 않는다", () => {
    const childTypes = darkMedia?.nodes.map((node: PostcssNode) => node.type);

    expect(childTypes).toEqual(["decl"]);
  });
});

describe("다크 미디어 쿼리 갈래 안의 팔레트가 다크 값인가", () => {
  let root: PostcssNode;

  beforeAll(() => {
    const processor = plainPostcssProcessor();
    const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf8");
    const result = processor.process(globalsCss, { from: GLOBALS_CSS_PATH });

    root = result.root;
  });

  it("최상위 @media (prefers-color-scheme: dark) 안의 선택자가 :root 하나뿐이다 — data-theme 조건이 안 붙는다", () => {
    const selectors = topLevelDarkMediaRules(root).map((rule) => rule.selector);

    expect(selectors).toEqual([":root"]);
  });

  it('최상위 [data-theme="dark"] 선택자 블록이 더 이상 생성물에 없다', () => {
    expect(topLevelDarkAttributeRules(root)).toEqual([]);
  });

  it("미디어 쿼리 갈래 안의 팔레트 값이 :root(라이트) 값과 다른 다크 값이다", () => {
    const lightValue = topLevelLightDeclaration(root, "--palette-neutral-00");
    const darkRules = topLevelDarkMediaRules(root);
    let darkValue: string | undefined;
    for (const rule of darkRules) {
      rule.walkDecls("--palette-neutral-00", (decl: PostcssNode) => {
        darkValue = decl.value;
      });
    }

    expect(darkValue).toBeDefined();
    expect(darkValue).not.toBe(lightValue);
  });
});
