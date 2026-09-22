/**
 * Expo Router의 라우트 타입을 만들고 실제로 섰는지 확인한다.
 *
 * `app.json`의 `experiments.typedRoutes`는 `.expo/types/router.d.ts`가 있을 때만 값을 한다.
 * 그 파일은 `.gitignore` 안이라 CI에는 없고, 없으면 `Href`가 `string`으로 떨어져
 * `router.replace("/없는경로")`가 `tsc`를 통과한다. 그래서 `pnpm typecheck`가 이 스크립트를
 * 먼저 부른다.
 *
 * 만드는 명령은 `expo customize tsconfig.json`이다 — Expo CLI의 `setupTypedRoutes`가
 * Metro나 개발 서버 없이 도는 유일한 진입점이고, `tsconfig.json`이 이미 맞으면 그 파일은
 * 안 바뀐다.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeRouteTypesViolation,
  routeTypesViolations,
} from "../tests/lint/route-types.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DECLARATION_PATH = path.join(ROOT, ".expo/types/router.d.ts");

function fail(message: string): never {
  console.error(`라우트 타입: ${message}`);
  process.exit(1);
}

/** `pnpm run` 밖에서 불려도 돌게 로컬 bin을 직접 가리킨다. */
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
