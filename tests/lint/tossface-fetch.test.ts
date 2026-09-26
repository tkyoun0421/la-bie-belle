import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  codepointToFilename,
  TOSSFACE_COMMIT_HASH,
  tossfaceSourceUrl,
} from "@tests/lint/tossface-fetch";

const ROOT = process.cwd();

/**
 * illustration.md 「토스페이스 스무 개」 표를 그대로 옮긴 것이다. 정본은 문서고,
 * 이 표는 대조용 사본이다.
 */
const TOSSFACE_TABLE: { codepoints: string[]; filename: string }[] = [
  { codepoints: ["1F492"], filename: "u1F492.svg" },
  { codepoints: ["1F4C5"], filename: "u1F4C5.svg" },
  { codepoints: ["1F64B"], filename: "u1F64B.svg" },
  { codepoints: ["23F0"], filename: "u23F0.svg" },
  { codepoints: ["1F4CB"], filename: "u1F4CB.svg" },
  { codepoints: ["1FAAA"], filename: "u1FAAA.svg" },
  { codepoints: ["1F465"], filename: "u1F465.svg" },
  { codepoints: ["1F4B0"], filename: "u1F4B0.svg" },
  { codepoints: ["1F4F1"], filename: "u1F4F1.svg" },
  { codepoints: ["1F4CA"], filename: "u1F4CA.svg" },
  { codepoints: ["1F4DE"], filename: "u1F4DE.svg" },
  { codepoints: ["1F514"], filename: "u1F514.svg" },
  { codepoints: ["1F317"], filename: "u1F317.svg" },
  { codepoints: ["1F48D"], filename: "u1F48D.svg" },
  { codepoints: ["1F511"], filename: "u1F511.svg" },
  { codepoints: ["1F44B"], filename: "u1F44B.svg" },
  { codepoints: ["1F4EE"], filename: "u1F4EE.svg" },
  { codepoints: ["1F4E2"], filename: "u1F4E2.svg" },
  { codepoints: ["1F501"], filename: "u1F501.svg" },
  { codepoints: ["1F4DD"], filename: "u1F4DD.svg" },
];

describe("codepointToFilename — illustration.md 토스페이스 표 스무 항목 (AC-01)", () => {
  it("정확히 스무 항목이다", () => {
    expect(TOSSFACE_TABLE).toHaveLength(20);
  });

  it.each(TOSSFACE_TABLE)(
    "$codepoints → $filename",
    ({ codepoints, filename }) => {
      expect(codepointToFilename(codepoints)).toBe(filename);
    },
  );

  it("소문자 코드포인트를 넘겨도 대문자 파일명을 낸다", () => {
    expect(codepointToFilename(["1f492"])).toBe("u1F492.svg");
  });

  it("조합 이모지는 코드포인트를 `_`로 이어 붙인다", () => {
    expect(codepointToFilename(["1F468", "200D", "1F469"])).toBe(
      "u1F468_200D_1F469.svg",
    );
  });

  it("파일 이름을 임의로 바꾸지 않는다 — 원본 코드포인트 자릿수 그대로다", () => {
    expect(codepointToFilename(["23F0"])).toBe("u23F0.svg");
    expect(codepointToFilename(["23F0"])).not.toBe("u023F0.svg");
  });
});

describe("tossfaceSourceUrl — 고정 커밋 해시에서 받아 온다 (AC-01)", () => {
  it("커밋 해시가 40자 16진수로 고정돼 있다", () => {
    expect(TOSSFACE_COMMIT_HASH).toMatch(/^[0-9a-f]{40}$/);
  });

  it("움직이는 참조(main·master·HEAD)를 해시로 쓰지 않는다", () => {
    expect(["main", "master", "HEAD", "latest"]).not.toContain(
      TOSSFACE_COMMIT_HASH,
    );
  });

  it("github.com/toss/tossface/raw/<해시>/dist/svg/<파일> 꼴이다 — raw가 없으면 404다", () => {
    expect(tossfaceSourceUrl("u1F492.svg")).toBe(
      `https://github.com/toss/tossface/raw/${TOSSFACE_COMMIT_HASH}/dist/svg/u1F492.svg`,
    );
  });
});

describe(".gitignore — assets/tossface/를 커밋하지 않는다 (AC-01)", () => {
  it(".gitignore에 assets/tossface/를 가리키는 줄이 있다", () => {
    const lines = readFileSync(path.join(ROOT, ".gitignore"), "utf8")
      .split("\n")
      .map((line) => line.trim());

    expect(lines.some((line) => /^\/?assets\/tossface\/?$/.test(line))).toBe(
      true,
    );
  });
});

describe("라이선스 안내 — 스크립트를 안 돌려도 저장소에 커밋돼 있다 (AC-01)", () => {
  it("assets/tossface/LICENSE가 있다", () => {
    expect(existsSync(path.join(ROOT, "assets/tossface/LICENSE"))).toBe(true);
  });

  it("assets/tossface/COPYRIGHT.md가 있다", () => {
    expect(existsSync(path.join(ROOT, "assets/tossface/COPYRIGHT.md"))).toBe(
      true,
    );
  });
});
