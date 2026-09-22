import { readFileSync } from "node:fs";
import path from "node:path";
import {
  fontCodepoints,
  koreanCommonSyllables,
  missingCodepoints,
  requiredCodepoints,
  SUBSET_DIR,
  SUBSET_FONTS,
  unicodesFile,
} from "@tests/lint/font-subset";

const ROOT = process.cwd();

function read(relative: string): ArrayBuffer {
  const file = readFileSync(path.join(ROOT, relative));

  return file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength,
  ) as ArrayBuffer;
}

describe("상용 2,350자 — EUC-KR 완성형 영역에서 표 없이 낸다", () => {
  const syllables = koreanCommonSyllables();

  it("정확히 2,350자다", () => {
    expect(syllables).toHaveLength(2350);
  });

  it("첫 글자가 「가」고 마지막이 「힝」이다", () => {
    expect(syllables[0]).toBe("가");
    expect(syllables.at(-1)).toBe("힝");
  });

  it("전부 한글 음절 영역 안이고 중복이 없다", () => {
    const codes = syllables.map((s) => s.codePointAt(0) as number);

    expect(new Set(codes).size).toBe(2350);
    expect(Math.min(...codes)).toBeGreaterThanOrEqual(0xac00);
    expect(Math.max(...codes)).toBeLessThanOrEqual(0xd7a3);
  });

  /** 상용 밖은 안 든다 — 그것이 9,256KB를 1,753KB로 줄이는 판단이다. */
  it("상용 밖 음절은 안 든다", () => {
    expect(syllables).not.toContain("뙇");
    expect(syllables).not.toContain("뷁");
    expect(syllables).not.toContain("씱");
  });
});

describe("필요한 코드포인트 — ASCII·자모·상용 한글·기호", () => {
  const required = requiredCodepoints();

  it("화면에 찍히는 ASCII를 공백부터 물결까지 든다", () => {
    expect(required.has(0x20)).toBe(true);
    expect(required.has(0x7e)).toBe(true);
    expect(required.has(0x41)).toBe(true);
  });

  it("한글 자모를 든다", () => {
    expect(required.has("ㄱ".codePointAt(0) as number)).toBe(true);
    expect(required.has("ㅣ".codePointAt(0) as number)).toBe(true);
  });

  it("시안과 코드가 실제로 쓰는 기호를 든다", () => {
    for (const symbol of ["·", "×", "—", "…", "≈", "「", "」", "①"]) {
      expect(required.has(symbol.codePointAt(0) as number)).toBe(true);
    }
  });

  /**
   * 원본 서체에 없는 글자를 요구하면 서브셋이 만들 수 없어 검사가 영영 빨갛다.
   * 시안이 쓰는 「✕」가 그 경우다 — 원본에 없어서 지금도 시스템 서체로 떨어진다.
   */
  it("원본에 없는 「✕」는 안 든다", () => {
    expect(required.has("✕".codePointAt(0) as number)).toBe(false);
    expect(required.has("×".codePointAt(0) as number)).toBe(true);
  });

  it("제어 문자는 안 든다", () => {
    expect(required.has(0x00)).toBe(false);
    expect(required.has(0x1f)).toBe(false);
  });

  it("pyftsubset이 읽는 꼴로 내보낸다", () => {
    const file = unicodesFile(new Set([0x20, 0xac00]));

    expect(file).toBe("U+0020\nU+AC00\n");
  });
});

describe("서브셋 서체 대조 — 실제 파일을 읽는다", () => {
  it("넷을 다 든다", () => {
    expect(SUBSET_FONTS).toHaveLength(4);
  });

  it.each(SUBSET_FONTS)("%s가 필요한 글자를 다 든다", (file) => {
    const missing = missingCodepoints(read(path.join(SUBSET_DIR, file)));

    expect(
      missing.map((code) => `U+${code.toString(16).toUpperCase()}`),
    ).toEqual([]);
  });

  it.each(SUBSET_FONTS)("%s가 원본보다 작다", (file) => {
    const subset = readFileSync(path.join(ROOT, SUBSET_DIR, file)).byteLength;
    const origin = readFileSync(
      path.join(ROOT, "assets/fonts", file),
    ).byteLength;

    expect(subset).toBeLessThan(origin / 2);
  });

  /** 읽는 쪽이 고장 나면 위 단언이 조용히 통과할 수 있어서 따로 본다. */
  it.each(SUBSET_FONTS)("%s의 cmap을 실제로 읽어낸다", (file) => {
    const codepoints = fontCodepoints(read(path.join(SUBSET_DIR, file)));

    expect(codepoints.size).toBeGreaterThan(2000);
  });
});
