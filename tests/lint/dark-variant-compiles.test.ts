import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const GLOBALS_CSS_PATH = path.join(process.cwd(), "src/app/globals.css");
const FIXTURE_UTILITY = "dark:border-input";
const FIXTURE_CLASS_SELECTOR = ".dark\\:border-input";
const SYSTEM_DARK_MEDIA = /prefers-color-scheme:\s*dark/;
const EXCLUDES_LIGHT_ATTRIBUTE = /not\(\[data-theme=["']light["']\]/;
const HAS_DARK_ATTRIBUTE = /\[data-theme=["']dark["']\]/;

type MatchedRule = { selector: string; mediaParams: string | null };

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

function darkVariantFixture(): string {
  const globalsCss = readFileSync(GLOBALS_CSS_PATH, "utf8");

  return `${globalsCss}\n\n@source inline("${FIXTURE_UTILITY}");\n`;
}

function rulesTargetingFixtureUtility(root: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walkRules: (callback: (rule: any) => void) => void;
}): MatchedRule[] {
  const matches: MatchedRule[] = [];

  root.walkRules((rule) => {
    if (typeof rule.selector !== "string") {
      return;
    }
    if (!rule.selector.includes(FIXTURE_CLASS_SELECTOR)) {
      return;
    }

    let ancestor = rule.parent;
    let mediaParams: string | null = null;
    while (ancestor && ancestor.type !== "root") {
      if (ancestor.type === "atrule" && ancestor.name === "media") {
        mediaParams = ancestor.params;
        break;
      }
      ancestor = ancestor.parent;
    }

    matches.push({ selector: rule.selector, mediaParams });
  });

  return matches;
}

describe("@custom-variant dark가 컴파일된 CSS에서 실제로 먹는가", () => {
  let matchedRules: MatchedRule[];

  beforeAll(async () => {
    const processor = tailwindPostcssProcessor();
    const result = await processor.process(darkVariantFixture(), {
      from: GLOBALS_CSS_PATH,
    });

    matchedRules = rulesTargetingFixtureUtility(result.root);
  });

  it('[data-theme="dark"]가 걸린 자리에서 dark: 유틸리티가 먹는다', () => {
    const appliesUnderDarkAttribute = matchedRules.some((rule) =>
      HAS_DARK_ATTRIBUTE.test(rule.selector),
    );

    expect(appliesUnderDarkAttribute).toBe(true);
  });

  it("data-theme 속성이 없어도 기기가 다크면 미디어 쿼리 갈래로 먹는다", () => {
    const appliesUnderSystemDark = matchedRules.some(
      (rule) =>
        rule.mediaParams !== null && SYSTEM_DARK_MEDIA.test(rule.mediaParams),
    );

    expect(appliesUnderSystemDark).toBe(true);
  });

  it('[data-theme="light"]가 걸리면 기기가 다크여도 미디어 쿼리 갈래가 안 먹는다', () => {
    const systemDarkRule = matchedRules.find(
      (rule) =>
        rule.mediaParams !== null && SYSTEM_DARK_MEDIA.test(rule.mediaParams),
    );

    expect(
      systemDarkRule !== undefined &&
        EXCLUDES_LIGHT_ATTRIBUTE.test(systemDarkRule.selector),
    ).toBe(true);
  });
});
