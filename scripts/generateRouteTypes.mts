import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeRouteTypesViolation,
  routeTypesViolations,
} from "../tests/lint/routeTypes.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DECLARATION_PATH = path.join(ROOT, ".expo/types/router.d.ts");

function fail(message: string): never {
  console.error(`라우트 타입: ${message}`);
  process.exit(1);
}

const EXPO_BIN = path.join(ROOT, "node_modules/.bin/expo");

if (!existsSync(EXPO_BIN)) {
  fail("`node_modules/.bin/expo`가 없다 — `pnpm install`이 먼저다");
}

execFileSync(EXPO_BIN, ["customize", "tsconfig.json"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: false,
});

if (!existsSync(DECLARATION_PATH)) {
  fail(
    `\`expo customize tsconfig.json\`이 돌았는데 ${path.relative(ROOT, DECLARATION_PATH)}가 없다`,
  );
}

const violations = routeTypesViolations(readFileSync(DECLARATION_PATH, "utf8"));

if (violations.length > 0) {
  fail(
    `${path.relative(ROOT, DECLARATION_PATH)}가 온전하지 않다 — ${violations
      .map(describeRouteTypesViolation)
      .join(", ")}`,
  );
}

console.log(
  `라우트 타입: ${path.relative(ROOT, DECLARATION_PATH)}가 섰다 — \`Href\`가 경로 유니언이다.`,
);
