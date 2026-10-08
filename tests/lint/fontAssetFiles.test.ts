import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const FONTS_DIR = path.join(process.cwd(), "assets/fonts");

const EXPECTED_FONT_FILENAMES = [
  "WantedSans-Regular.ttf",
  "WantedSans-Medium.ttf",
  "WantedSans-SemiBold.ttf",
  "WantedSans-Bold.ttf",
];

const FVAR_TABLE_TAG = "fvar";

function sfntTableTags(buffer: Buffer): string[] {
  const numTables = buffer.readUInt16BE(4);
  const tags: string[] = [];

  for (let tableIndex = 0; tableIndex < numTables; tableIndex += 1) {
    const recordOffset = 12 + tableIndex * 16;
    tags.push(buffer.toString("ascii", recordOffset, recordOffset + 4));
  }

  return tags;
}

describe("assets/fonts가 Wanted Sans 정적 서체 넷을 담고 있는가 (AC-05)", () => {
  it("assets/fonts의 .ttf 파일명 넷이 정본 표와 대소문자까지 정확히 같다", () => {
    const actualTtfFilenames = readdirSync(FONTS_DIR)
      .filter((filename) => filename.endsWith(".ttf"))
      .sort();

    expect(actualTtfFilenames).toEqual([...EXPECTED_FONT_FILENAMES].sort());
  });

  it.each(EXPECTED_FONT_FILENAMES)(
    "%s는 가변 서체가 아니다 — sfnt 테이블 디렉터리에 fvar 태그가 없다",
    (filename) => {
      const buffer = readFileSync(path.join(FONTS_DIR, filename));

      expect(sfntTableTags(buffer)).not.toContain(FVAR_TABLE_TAG);
    },
  );
});
