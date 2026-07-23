import { loadIndex, repoRootFrom, validateIndex } from "./lib/index.mjs";

const root = repoRootFrom(import.meta.url);
const { entries } = loadIndex(root);
const errors = validateIndex(entries);
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`작업 인덱스가 유효합니다: ${entries.length}개 항목`);
