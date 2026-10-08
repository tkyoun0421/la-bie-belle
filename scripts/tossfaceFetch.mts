import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOSSFACE_COMMIT_HASH,
  TOSSFACE_DIR,
  TOSSFACE_LICENSE_FILES,
  tossfaceSourceUrl,
  tossfaceFilenames,
} from "../tests/lint/tossfaceFetch.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUTPUT_DIR = path.join(ROOT, TOSSFACE_DIR);

function fail(message: string): never {
  console.error(`토스페이스: ${message}`);
  process.exit(1);
}

async function download(filename: string): Promise<Uint8Array> {
  const url = tossfaceSourceUrl(filename);
  const response = await fetch(url);

  if (!response.ok) {
    fail(`${filename}을 못 받았다 — ${response.status} ${url}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

const missingLicenses = TOSSFACE_LICENSE_FILES.filter(
  (filename) => !existsSync(path.join(OUTPUT_DIR, filename)),
);

if (missingLicenses.length > 0) {
  fail(
    `재배포 조건인 ${missingLicenses.join("·")}가 없다. 저장소에 커밋돼 있어야 하는 파일이다.`,
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const filenames = tossfaceFilenames();
const files = await Promise.all(
  filenames.map(
    async (filename) => [filename, await download(filename)] as const,
  ),
);

for (const [filename, bytes] of files) {
  writeFileSync(path.join(OUTPUT_DIR, filename), bytes);
}

const total = files.reduce((sum, [, bytes]) => sum + bytes.byteLength, 0);

console.warn(
  `토스페이스 ${files.length}장을 ${TOSSFACE_DIR}/에 받았다 — ${Math.round(total / 1024)}KB, ${TOSSFACE_COMMIT_HASH.slice(0, 7)}`,
);
