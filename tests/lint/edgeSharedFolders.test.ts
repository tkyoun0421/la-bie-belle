import { readFileSync } from "node:fs";

const RULE_FILE = "eslint-rules/noNodeImportInEdgeShared.mjs";
const SYNC_FILE = "scripts/syncEdgeShared.mts";

function arrayLiteral(file: string, name: string): string {
  const source = readFileSync(file, "utf8");
  const opened = source.indexOf(`const ${name} = [`);

  if (opened === -1) {
    throw new Error(`${file}에 ${name} 배열이 없다`);
  }

  const closed = source.indexOf("];", opened);

  if (closed === -1) {
    throw new Error(`${file}의 ${name} 배열이 안 닫혔다`);
  }

  return source.slice(opened, closed);
}

function foldersOf(block: string): string[] {
  return [...block.matchAll(/"(src\/[^"]+?)\/?"/g)]
    .map(([, folder]) => folder)
    .sort();
}

describe("Deno로 복사되는 폴더 목록", () => {
  it("검사가 무는 폴더와 복사가 가져가는 폴더가 같다", () => {
    const bitten = foldersOf(arrayLiteral(RULE_FILE, "COPIED_TO_DENO"));
    const copied = foldersOf(arrayLiteral(SYNC_FILE, "FOLDERS"));

    expect(bitten).toEqual(copied);
  });

  it("낱개로 복사되는 파일은 그 폴더가 검사 안에 든다", () => {
    const bitten = foldersOf(arrayLiteral(RULE_FILE, "COPIED_TO_DENO"));
    const files = [
      ...arrayLiteral(SYNC_FILE, "ENTRIES").matchAll(/"(src\/[^"]+)"/g),
    ].map(([, file]) => file);

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      expect(bitten.some((folder) => file.startsWith(`${folder}/`))).toBe(true);
    }
  });
});
