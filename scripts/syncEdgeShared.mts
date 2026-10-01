/**
 * Edge Function이 쓰는 `src/`의 순수 함수를 `supabase/functions/_shared/`로 복사한다.
 *
 *   node --experimental-strip-types scripts/sync-edge-shared.mts
 *
 * edge-runtime 컨테이너에는 `supabase/functions` 한 폴더만 마운트된다. `deno.json`이
 * `../../src/`를 맵핑해도 그 경로가 컨테이너 안에 없어 `Module not found`다 — 심볼릭 링크도
 * 타깃이 마운트 밖이라 끊긴다(notification/design.md 「푸시 보내기」).
 *
 * **`cp`만으로는 안 된다.** Deno는 import 지정자에 확장자를 요구하는데 `src/`는 안 적는다.
 * 옮기면서 상대 지정자에 `.ts`를 붙이고, `@/`로 시작하는 별칭은 복사본 안의 상대 경로로
 * 다시 쓴다.
 *
 * **함수가 실제로 부르는 것만 옮긴다.** 아래 `ENTRIES`에서 import를 따라가 닿는 파일이
 * 전부고, 폴더를 통째로 옮기면 React 훅처럼 Deno에서 못 서는 파일이 같이 실려 「도는 줄
 * 알았는데 안 도는」 자리가 는다. 닿은 파일의 지정자가 `FOLDERS` 어디에도 안 걸리면 여기서
 * 던진다 — 조용히 깨진 복사본을 배포하는 것보다 낫다.
 *
 * 복사본은 생성물이라 커밋하지 않는다(`.gitignore`). 정본은 `src/`고, 복사본이 옛것이 되는
 * 것은 `pnpm dev`와 CI가 이 단계를 먼저 부르는 것으로 막는다. 마운트 밖을 다시 가리키는
 * import는 `house/no-edge-function-src-import`가 글자로 막는다.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SHARED = path.join(ROOT, "supabase/functions/_shared");

/** Edge Function이 `_shared`에서 직접 가져오는 파일들이다. */
const ENTRIES = [
  "src/features/notification/model/push-message.ts",
  "src/features/notification/model/push-result.ts",
  "src/features/payroll/model/holiday-api-response.ts",
];

/** `src/`의 어느 자리가 복사본의 어느 자리로 가는지다. */
const FOLDERS = [
  { from: "src/features/notification/model", to: "notification" },
  { from: "src/entities/notification/model", to: "notification/entities" },
  { from: "src/features/payroll/model", to: "payroll" },
];

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g;

/** `src/` 안의 파일 하나가 복사본에서 앉을 자리. 맵이 없으면 던진다. */
function targetOf(source: string): string {
  const folder = FOLDERS.find((one) => source.startsWith(`${one.from}/`));

  if (folder === undefined) {
    throw new Error(
      `${source} 를 옮길 자리가 없다. scripts/sync-edge-shared.mts 의 FOLDERS 에 그 폴더를 더해라.`,
    );
  }

  return path.posix.join(folder.to, source.slice(folder.from.length + 1));
}

/** 지정자 하나가 가리키는 `src/` 안의 파일. 밖(`npm:`·`jsr:`·`http:`)이면 널이다. */
function sourceOf(specifier: string, from: string): string | null {
  if (specifier.startsWith("@/")) {
    return withExtension(`src/${specifier.slice("@/".length)}`);
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return withExtension(path.posix.join(path.posix.dirname(from), specifier));
  }

  return null;
}

function withExtension(source: string): string {
  return source.endsWith(".ts") ? source : `${source}.ts`;
}

function relativeSpecifier(here: string, target: string): string {
  const relative = path.posix.relative(path.posix.dirname(here), target);

  return relative.startsWith(".") ? relative : `./${relative}`;
}

const copied = new Map<string, string>();

function copy(source: string): void {
  if (copied.has(source)) {
    return;
  }

  const target = targetOf(source);
  copied.set(source, target);

  const rewritten = readFileSync(path.join(ROOT, source), "utf8").replace(
    SPECIFIER,
    (match, head, quote, specifier) => {
      const reached = sourceOf(specifier, source);

      if (reached === null) {
        return match;
      }

      copy(reached);

      return `${head}${quote}${relativeSpecifier(target, targetOf(reached))}${quote}`;
    },
  );

  const absolute = path.join(SHARED, target);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, rewritten, "utf8");
}

rmSync(SHARED, { recursive: true, force: true });

for (const entry of ENTRIES) {
  copy(entry);
}

console.log(`_shared: ${copied.size}개 파일을 복사했다`);
