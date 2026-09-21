import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { compile } from "react-native-css/compiler";

const GLOBALS_CSS_PATH = path.join(process.cwd(), "src/app/globals.css");

/**
 * 실제 화면에서 쓰는 유틸 조합이다 — 브랜드 배경 하나, 중립 배경·글자색 하나씩,
 * 스페이싱 눈금 하나(p-4), 타이포 하나(text-base). `@source inline(...)`이 없으면
 * Tailwind가 이 클래스들을 쓰는 곳이 없다고 보고 CSS를 안 만든다.
 */
const FIXTURE_UTILITIES =
  "bg-bg-brand-solid text-fg-neutral bg-bg-neutral p-4 text-base";

const PALETTE_BRAND_700 = "palette-brand-700";
const PALETTE_NEUTRAL_00 = "palette-neutral-00";
const PALETTE_NEUTRAL_1000 = "palette-neutral-1000";
const SYSTEM_DARK_CONDITION = [["=", "prefers-color-scheme", "dark"]];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompiledNode = any;

// react-native-css/compiler가 실제로 내는 타입은 ReactNativeCssStyleSheet인데
// s·vr을 optional로 선언한다. 이 테스트는 값의 구조(entries)를 직접 순회하며
// 검증하니 이웃 dark-media-query-compiles.test.ts의 PostcssNode처럼 any로 느슨하게 받는다.
type CompiledStylesheet = CompiledNode;

type ConditionalValue = [CompiledNode] | [CompiledNode, CompiledNode];

/**
 * `@tailwindcss/postcss`가 실제로 요구하는 postcss와 최상위 postcss 패키지가
 * pnpm 하에서 서로 다른 인스턴스로 깔릴 수 있다(타입도 따라 갈라진다). 플러그인
 * 안쪽에서 require하는 postcss를 그대로 가져와야 타입도 값도 같은 것을 쓴다 —
 * 이웃 dark-media-query-compiles.test.ts의 tailwindPostcssProcessor()와 같은 이유다.
 */
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

async function compileNativeStylesheet(): Promise<CompiledStylesheet> {
  const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf8");
  const processor = tailwindPostcssProcessor();
  const result = await processor.process(
    `${globalsCss}\n@source inline("${FIXTURE_UTILITIES}");\n`,
    { from: GLOBALS_CSS_PATH },
  );

  // compile()이 돌려주는 것은 함수를 담은 lazy 객체다. .stylesheet()를 불러야
  // 실제 규칙·루트 변수 값이 나온다 — 안 부르면 JSON.stringify가 {}를 낸다.
  return compile(result.css, {}).stylesheet();
}

function styleEntry(sheet: CompiledStylesheet, utilityClassName: string) {
  const rule = sheet.s.find(
    ([name]: CompiledNode) => name === utilityClassName,
  );
  if (!rule) {
    throw new Error(`유틸 ${utilityClassName}이 컴파일 결과에 없다`);
  }

  return rule[1][0];
}

function collectPlainObjects(
  node: CompiledNode,
): Record<string, CompiledNode>[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectPlainObjects);
  }
  if (node && typeof node === "object") {
    return [node, ...Object.values(node).flatMap(collectPlainObjects)];
  }
  return [];
}

/**
 * 선언 트리에서 특정 property(padding·fontSize 등) 값을 찾는다. 컴파일러가 내는
 * 선언 형태가 유틸마다 다르게 중첩돼 있어(예: text-base는 fontSize 옆에 lineHeight
 * 계산식이 배열로 따라붙는다) 정확한 트리 모양 대신 값 하나만 짚는다.
 */
function declaredNumber(
  sheet: CompiledStylesheet,
  utilityClassName: string,
  property: string,
): number | undefined {
  const objects = collectPlainObjects(styleEntry(sheet, utilityClassName).d);
  const withProperty = objects.find(
    (object) => typeof object[property] === "number",
  );

  return withProperty?.[property];
}

/**
 * 선언 트리 안에서 `[..., "var", "팔레트-이름", ...]` 꼴로 박힌 변수 참조를 찾는다.
 * 색 유틸은 hex를 직접 안 넣고 이 변수 참조로 남아야 라이트·다크가 런타임에 갈린다.
 */
function referencedVariableName(node: CompiledNode): string | undefined {
  if (Array.isArray(node)) {
    const varIndex = node.indexOf("var");
    if (varIndex !== -1 && typeof node[varIndex + 1] === "string") {
      return node[varIndex + 1];
    }
    for (const child of node) {
      const found = referencedVariableName(child);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      const found = referencedVariableName(value);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

function paletteVariableEntries(
  sheet: CompiledStylesheet,
  variableName: string,
): ConditionalValue[] {
  const entry = sheet.vr.find(([name]: CompiledNode) => name === variableName);
  if (!entry) {
    throw new Error(`루트 변수 ${variableName}이 vr에 없다`);
  }

  return entry[1];
}

function lightValueOf(entries: ConditionalValue[]): CompiledNode {
  const fallback = entries.find((entry) => entry.length === 1);
  if (!fallback) {
    throw new Error("조건 없는 기본(라이트) 값이 없다");
  }

  return fallback[0];
}

function darkEntryOf(entries: ConditionalValue[]): {
  value: CompiledNode;
  condition: CompiledNode;
} {
  const conditional = entries.find((entry) => entry.length === 2);
  if (!conditional) {
    throw new Error("조건부(다크) 값이 없다");
  }

  return { value: conditional[0], condition: conditional[1] };
}

describe("네이티브 컴파일 파이프라인이 치수 정본과 같은 값을 내는가 (AC-02)", () => {
  let sheet: CompiledStylesheet;

  beforeAll(async () => {
    sheet = await compileNativeStylesheet();
  });

  it("네이티브 rem 기준을 16으로 올린다 — 기본값 14로 돌아가면 스페이싱·타이포가 통째로 작아진다", () => {
    const remEntry = paletteVariableEntries(sheet, "__rn-css-rem");

    expect(lightValueOf(remEntry)).toBe(16);
  });

  it("p-4가 16pt로 컴파일된다", () => {
    expect(declaredNumber(sheet, "p-4", "padding")).toBe(16);
  });

  it("text-base의 fontSize가 17이다 — 정본 --text-base: 1.0625rem × rem 16", () => {
    expect(declaredNumber(sheet, "text-base", "fontSize")).toBe(17);
  });
});

describe("네이티브 컴파일 파이프라인이 색 정본과 같은 값을 내는가 (AC-03)", () => {
  let sheet: CompiledStylesheet;

  beforeAll(async () => {
    sheet = await compileNativeStylesheet();
  });

  it("bg-bg-brand-solid는 hex가 아니라 palette-brand-700 변수를 가리킨다", () => {
    const declaration = styleEntry(sheet, "bg-bg-brand-solid").d;

    expect(referencedVariableName(declaration)).toBe(PALETTE_BRAND_700);
  });

  it("bg-bg-neutral은 palette-neutral-00 변수를 가리킨다", () => {
    const declaration = styleEntry(sheet, "bg-bg-neutral").d;

    expect(referencedVariableName(declaration)).toBe(PALETTE_NEUTRAL_00);
  });

  it("text-fg-neutral은 palette-neutral-1000 변수를 가리킨다", () => {
    const declaration = styleEntry(sheet, "text-fg-neutral").d;

    expect(referencedVariableName(declaration)).toBe(PALETTE_NEUTRAL_1000);
  });

  it("palette-brand-700의 라이트 값이 OKLCH가 아니라 hex로 풀려 있다 — RN 색 파서가 oklch()를 못 읽는다", () => {
    const lightValue = lightValueOf(
      paletteVariableEntries(sheet, PALETTE_BRAND_700),
    );

    expect(lightValue).toMatch(/^#[0-9a-f]{3,8}$/i);
  });

  it("palette-brand-700의 라이트 값이 ADR-012가 정한 브랜드 파랑(#2f5cf6)과 같다", () => {
    const lightValue = lightValueOf(
      paletteVariableEntries(sheet, PALETTE_BRAND_700),
    );

    expect(lightValue).toBe("#2f5cf6");
  });
});

describe("네이티브 컴파일 파이프라인의 다크 갈래가 시스템 미디어 쿼리 하나로 좁혀지는가 (AC-04)", () => {
  let sheet: CompiledStylesheet;

  beforeAll(async () => {
    sheet = await compileNativeStylesheet();
  });

  it("palette-brand-700의 다크 값이 라이트 값과 다르다", () => {
    const entries = paletteVariableEntries(sheet, PALETTE_BRAND_700);

    expect(darkEntryOf(entries).value).not.toBe(lightValueOf(entries));
  });

  it("palette-brand-700의 다크 조건이 prefers-color-scheme: dark 하나뿐이다 — data-theme 같은 속성 조건이 안 붙는다", () => {
    const entries = paletteVariableEntries(sheet, PALETTE_BRAND_700);

    expect(darkEntryOf(entries).condition).toEqual(SYSTEM_DARK_CONDITION);
  });

  it("palette-neutral-00의 다크 값도 라이트 값과 다르다 — 팔레트 하나가 아니라 다크 갈래 자체가 살아 있는지를 본다", () => {
    const entries = paletteVariableEntries(sheet, PALETTE_NEUTRAL_00);

    expect(darkEntryOf(entries).value).not.toBe(lightValueOf(entries));
  });
});
