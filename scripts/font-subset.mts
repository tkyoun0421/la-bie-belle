/**
 * Wanted Sans 넷을 서브셋으로 줄여 `assets/fonts/subset/`에 낸다.
 *
 * 원본 넷은 한 장이 2.3MB고 넷이면 9.4MB가 설치 크기에 그대로 실린다. 남길 글자의 정본은
 * `docs/2-design/design-system/foundation/typography.md`의 「서브셋」 절이고, 실제 집합은
 * `tests/lint/font-subset.ts`가 계산한다 — 그 파일을 테스트가 같이 물어서 집합이 바뀌면
 * 서체도 다시 만들어야 하는 것이 검사에 걸린다.
 *
 * 전제: `pyftsubset`(fonttools)이 PATH에 있어야 한다. 없으면 어떻게 깔지 알려주고 멈춘다.
 * 만든 결과는 커밋한다 — CI는 이 스크립트를 안 돌리고 `pnpm test`가 결과물만 대조한다.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  missingCodepoints,
  requiredCodepoints,
  SUBSET_DIR,
  SUBSET_FONTS,
  unicodesFile,
} from "../tests/lint/font-subset.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const ORIGIN_DIR = path.join(ROOT, "assets/fonts");
const OUTPUT_DIR = path.join(ROOT, SUBSET_DIR);
const UNICODES_PATH = path.join(OUTPUT_DIR, "codepoints.txt");

function fail(message: string): never {
  console.error(`서체 서브셋: ${message}`);
  process.exit(1);
}

function has(command: string): boolean {
  try {
    execFileSync("command", ["-v", command], { stdio: "ignore", shell: true });

    return true;
  } catch {
    return false;
  }
}

function kib(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString("en-US")}KB`;
}

if (!has("pyftsubset")) {
  fail(
    [
      "`pyftsubset`이 PATH에 없다. fonttools를 깔아라 —",
      "  pipx install fonttools    (권장, 시스템 파이썬을 안 건드린다)",
      "  또는  python3 -m venv .venv && .venv/bin/pip install fonttools",
      "        이때는 `.venv/bin`을 PATH에 얹고 다시 돌린다.",
    ].join("\n"),
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const codepoints = requiredCodepoints();

writeFileSync(UNICODES_PATH, unicodesFile(codepoints), "utf8");
console.log(
  `서체 서브셋: 남길 글자 ${codepoints.size.toLocaleString("en-US")}자.`,
);

let originTotal = 0;
let subsetTotal = 0;

for (const file of SUBSET_FONTS) {
  const origin = path.join(ORIGIN_DIR, file);

  if (!existsSync(origin)) {
    fail(`원본이 없다 — ${path.relative(ROOT, origin)}`);
  }

  const output = path.join(OUTPUT_DIR, file);

  execFileSync(
    "pyftsubset",
    [
      origin,
      `--unicodes-file=${UNICODES_PATH}`,
      `--output-file=${output}`,
      // 이름표를 지우면 시스템이 서체를 못 알아본다.
      "--name-IDs=*",
      // 한글 조합·커닝이 이 피처들에 산다.
      "--layout-features=*",
    ],
    { cwd: ROOT, stdio: "inherit" },
  );

  const missing = missingCodepoints(
    readFileSync(output).buffer as ArrayBuffer,
  ).map((code) => `U+${code.toString(16).toUpperCase()}`);

  if (missing.length > 0) {
    fail(
      `${file}에 ${missing.length}자가 안 들었다 — ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? " …" : ""}`,
    );
  }

  const originSize = statSync(origin).size;
  const subsetSize = statSync(output).size;

  originTotal += originSize;
  subsetTotal += subsetSize;

  console.log(
    `  ${file} — ${kib(originSize)} → ${kib(subsetSize)} (${Math.round((1 - subsetSize / originSize) * 100)}% 줄었다)`,
  );
}

console.log(
  `서체 서브셋: 넷 합계 ${kib(originTotal)} → ${kib(subsetTotal)}. 줄인 크기를 \`tokens.md\`의 서체 표에 적는다.`,
);
