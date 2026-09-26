/**
 * 토스페이스 SVG 스무 장을 고정 커밋에서 받아 `assets/tossface/`에 낸다.
 *
 * 파일을 커밋하지 않는 근거는 `docs/2-design/design-system/illustration.md`의
 * 「토스페이스 사용 규칙」이다 — 저작권 안내가 「소스코드로 변환하여 복제·전송」을 막는데
 * 그것이 SVG 텍스트를 가리키는지 원문이 가르지 않는다. 받아 오는 쪽은 그 해석에 안 걸린다.
 *
 * 무엇을 어디서 받는지는 `tests/lint/tossface-fetch.ts`가 든다 — `scripts/*.mts`는 짝
 * 테스트를 안 무는 자리라 판정을 거기 두면 검사가 안 걸린다(`font-subset` 관행).
 *
 * 라이선스 둘은 이 스크립트가 안 받는다. 스크립트를 한 번도 안 돌린 클론에도 재배포 조건이
 * 서 있어야 해서 저장소에 커밋돼 있고, 여기서는 그 둘이 자리에 있는지만 본다.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOSSFACE_COMMIT_HASH,
  TOSSFACE_DIR,
  TOSSFACE_LICENSE_FILES,
  tossfaceDownloadUrl,
  tossfaceFilenames,
} from "../tests/lint/tossface-fetch.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUTPUT_DIR = path.join(ROOT, TOSSFACE_DIR);

function fail(message: string): never {
  console.error(`토스페이스: ${message}`);
  process.exit(1);
}

async function download(filename: string): Promise<Uint8Array> {
  const url = tossfaceDownloadUrl(filename);
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
