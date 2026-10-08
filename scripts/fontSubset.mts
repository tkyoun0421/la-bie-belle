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
} from "../tests/lint/fontSubset.ts";

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
      "--name-IDs=*",
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
