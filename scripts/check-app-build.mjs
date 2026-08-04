import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_ONLY_MARKER = "labiebelle-server-only-marker";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientBundleDirectory = join(root, ".next", "static");

function fail(message, hint) {
  process.stderr.write(`[check:app-build] ${message}\n  힌트: ${hint}\n`);
  process.exit(1);
}

function listFiles(directory) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch {
    return null;
  }
  return entries.flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? (listFiles(path) ?? []) : [path];
  });
}

try {
  execFileSync("pnpm", ["build"], { cwd: root, stdio: "inherit" });
} catch {
  fail("production 빌드가 실패했습니다.", "pnpm build 출력을 확인하세요.");
}

const files = listFiles(clientBundleDirectory);
if (files === null) {
  fail(".next/static을 읽지 못했습니다.", "빌드가 클라이언트 번들을 만들었는지 확인하세요.");
}

const leaked = files.filter((path) => readFileSync(path, "utf8").includes(SERVER_ONLY_MARKER));
if (leaked.length > 0) {
  fail(
    `서버 전용 값이 클라이언트 번들 ${leaked.length}개 파일에 포함됐습니다.`,
    `${leaked[0]?.slice(root.length + 1)} 등에서 server-only 모듈이 클라이언트로 넘어간 경로를 찾으세요.`,
  );
}
