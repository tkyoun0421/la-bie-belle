import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientBundleDirectory = join(root, ".next", "static");
const envPath = join(root, ".env");
const SERVER_SECRET_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "VAPID_PRIVATE_KEY", "QR_SIGNING_SECRET"];

function fail(message, hint) {
  process.stderr.write(`[check:client-secret-scan] ${message}\n  힌트: ${hint}\n`);
  process.exit(1);
}

function parseEnvFile(path) {
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  const entries = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    entries[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
  }
  return entries;
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

const env = parseEnvFile(envPath);
if (env === null) {
  fail(".env 파일을 찾지 못했습니다.", ".env.example을 .env로 복사한 뒤 다시 실행하세요.");
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

const bundleContents = files.map((path) => ({ path, content: readFileSync(path, "utf8") }));

const leaked = SERVER_SECRET_KEYS.flatMap((key) => {
  const value = env[key];
  if (value === undefined || value.length === 0) {
    return [];
  }
  return bundleContents
    .filter(({ content }) => content.includes(value))
    .map(({ path }) => ({ key, path }));
});

if (leaked.length > 0) {
  const first = leaked[0];
  fail(
    `서버 비밀값(${first.key})이 클라이언트 번들 ${leaked.length}건에 포함됐습니다.`,
    `${first.path.slice(root.length + 1)} 등에서 서버 전용 값이 클라이언트로 넘어간 경로를 찾으세요.`,
  );
}
