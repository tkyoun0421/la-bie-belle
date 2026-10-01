/**
 * Edge Function이 쓰는 `src/`의 순수 함수를 `supabase/functions/_shared/`로 복사한다.
 *
 *   node --experimental-strip-types scripts/syncEdgeShared.mts
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

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SHARED = path.join(ROOT, "supabase/functions/_shared");

/** Edge Function이 `_shared`에서 직접 가져오는 파일들이다. */
const ENTRIES = [
  "src/entities/notification/utils/pushMessage.utils.ts",
  "src/entities/notification/model/pushResult.policy.ts",
  "src/features/holiday/model/holiday.schema.ts",
];

/** `src/`의 어느 자리가 복사본의 어느 자리로 가는지다. */
const FOLDERS = [
  { from: "src/entities/notification/model", to: "notification" },
  { from: "src/entities/notification/utils", to: "notification" },
  { from: "src/features/holiday/model", to: "holiday" },
];

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g;

/** `src/` 안의 파일 하나가 복사본에서 앉을 자리. 맵이 없으면 던진다. */
function targetOf(source: string): string {
  const folder = FOLDERS.find((one) => source.startsWith(`${one.from}/`));

  if (folder === undefined) {
    throw new Error(
      `${source} 를 옮길 자리가 없다. scripts/syncEdgeShared.mts 의 FOLDERS 에 그 폴더를 더해라.`,
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

/**
 * 함수가 부르는 `../_shared/...`가 복사본에 실제로 있는지 본다.
 *
 * 복사하는 쪽만 맞춰 두면 부르는 쪽이 조용히 어긋난다 — `src/`의 이름을 바꿀 때 `ENTRIES`는
 * 따라가고 함수의 지정자는 안 따라간 적이 있다([관찰 049](../docs/observations/049-edge-functions-outside-every-check.md)).
 * `supabase/functions/`는 `typecheck`의 `exclude`에 들고 CI가 `edge-runtime`을 안 띄우고
 * `_shared`는 생성물이라 diff에도 안 떠, 그 어긋남을 볼 자리가 배포뿐이었다.
 */
function checkFunctionImports(): void {
  const missing: string[] = [];
  const functions = path.join(ROOT, "supabase/functions");

  for (const name of readdirSync(functions, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name === "_shared") {
      continue;
    }

    const entry = path.join(functions, name.name, "index.ts");
    const source = readFileSync(entry, "utf8");

    for (const [, , , specifier] of source.matchAll(SPECIFIER)) {
      if (!specifier.includes("_shared/")) {
        continue;
      }

      const wanted = specifier.slice(
        specifier.indexOf("_shared/") + "_shared/".length,
      );

      if (!existsSync(path.join(SHARED, wanted))) {
        missing.push(`supabase/functions/${name.name}/index.ts → ${specifier}`);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `복사본에 없는 파일을 부른다:\n  ${missing.join("\n  ")}\n` +
        "ENTRIES 를 고쳤으면 함수의 import 지정자도 같이 고쳐라.",
    );
  }
}

rmSync(SHARED, { recursive: true, force: true });

for (const entry of ENTRIES) {
  copy(entry);
}

checkFunctionImports();

console.log(`_shared: ${copied.size}개 파일을 복사했다`);
