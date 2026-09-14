// 문서 이동 PR에서 옛 파일의 문장이 새 파일 어딘가에 그대로 있는지 센다.
//
//   node --experimental-strip-types scripts/check-moved-lines.mts <base-ref> <옛 파일>... -- <새 파일>...
//
// 옛 파일은 <base-ref>(보통 origin/main)에서 읽고 새 파일은 작업 트리에서 읽는다.
// 제목·표 구분선·빈 줄·목차 줄은 세지 않는다. 링크의 목적지 경로는 비교에서 뺀다 —
// 이동하면 경로가 바뀌는 것이 당연해서다. 남은 줄이 있으면 목록을 찍고 1로 끝난다.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const sep = args.indexOf("--");
if (sep < 1 || sep === args.length - 1) {
  console.error(
    "사용법: check-moved-lines.mts <base-ref> <옛 파일>... -- <새 파일>...",
  );
  process.exit(2);
}
const [baseRef, ...oldFiles] = args.slice(0, sep);
const newFiles = args.slice(sep + 1);

const LINK = /\]\([^)]*\)/g;
const HEADING = /^#{1,6}\s/;
const TABLE_RULE = /^\|?\s*:?-{3,}/;
const TOC = /^\s*-\s+\[[^\]]+\]\(#[^)]*\)\s*$/;

function normalize(line: string): string {
  return line.replace(LINK, "]()").replace(/\s+/g, " ").trim();
}

function countable(line: string): boolean {
  const t = line.trim();
  if (t === "") return false;
  if (HEADING.test(t)) return false;
  if (TABLE_RULE.test(t)) return false;
  if (TOC.test(t)) return false;
  if (t === "---") return false;
  return true;
}

const haystack = new Set<string>();
for (const file of newFiles) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    haystack.add(normalize(line));
  }
}

let missing = 0;
for (const file of oldFiles) {
  const source = execFileSync("git", ["show", `${baseRef}:${file}`], {
    encoding: "utf8",
  });
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    if (!countable(line)) return;
    if (haystack.has(normalize(line))) return;
    missing += 1;
    console.log(`${file}:${index + 1}: ${line.trim()}`);
  });
}

if (missing > 0) {
  console.log(`\n옛 파일의 줄 ${missing}개가 새 파일에 없다.`);
  process.exit(1);
}
console.log("옛 파일의 세는 줄이 전부 새 파일에 있다.");
