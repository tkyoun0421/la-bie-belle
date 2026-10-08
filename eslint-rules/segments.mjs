import path from "node:path";

/**
 * 세그먼트를 보는 규칙들이 나눠 쓰는 손이다. ADR-015 「세그먼트 열」이 자리를 정하고
 * 여기는 그 자리를 경로에서 읽어낸다.
 *
 * 경로 꼴이 둘이다 — `shared/`는 슬라이스가 없어 세그먼트가 바로 오고, 쪼개지는 층 셋은
 * 슬라이스를 한 칸 끼운다. `src/app/`은 Expo Router가 파일 이름을 URL로 읽는 자리라
 * 세그먼트가 없다.
 */

const SOURCE_ROOT = "src/";
const ALIAS = "@/";
const SLICED_LAYERS = new Set(["entities", "features", "screens"]);

/**
 * `@/shared/api/supabase`가 내보내는 손잡이다. 패키지를 당기는 축과 인스턴스를 당기는
 * 축이 다르고(ADR-015 「집행」의 마지막 문단) 그 둘을 규칙 둘이 나눠 든다 — 이 이름이
 * 그 경계라 양쪽이 같은 글자를 봐야 한다.
 */
export const SUPABASE_INSTANCE_MODULE = "@/shared/api/supabase";

export const API_SEGMENT = "api";
export const UI_SEGMENT = "ui";
export const SERVICES_SEGMENT = "services";

function locationOf(parts) {
  const [layer, ...rest] = parts;

  if (!layer) {
    return null;
  }

  if (SLICED_LAYERS.has(layer)) {
    return {
      layer,
      slice: rest[0] ?? null,
      segment: rest.length >= 3 ? rest[1] : null,
    };
  }

  return {
    layer,
    slice: null,
    segment: layer === "shared" && rest.length >= 2 ? rest[0] : null,
  };
}

/** 검사 중인 파일의 자리. `src/` 밖이면 `null`이다. */
export function fileLocation(context) {
  const relative = path
    .relative(context.cwd, context.filename)
    .split(path.sep)
    .join("/");

  if (!relative.startsWith(SOURCE_ROOT)) {
    return null;
  }

  return locationOf(relative.slice(SOURCE_ROOT.length).split("/"));
}

/** import 지정자가 가리키는 자리. `@/`로 시작하지 않으면 `null`이다. */
export function specifierLocation(specifier) {
  if (typeof specifier !== "string" || !specifier.startsWith(ALIAS)) {
    return null;
  }

  return locationOf(specifier.slice(ALIAS.length).split("/"));
}

/**
 * 모듈을 당기는 자리 전부를 한 손으로 받는다. `import`만 보면 재수출이 그물을 빠져나간다
 * — `export { x } from "..."`가 같은 의존을 만들고 쓰는 쪽은 중간 파일만 당기면 되니,
 * 세그먼트 검사가 한 칸 건너 무의미해진다(docs/observations/051-reexport-bypasses-segment-checks.md).
 */
export function importEdges(visit) {
  return {
    ImportDeclaration: visit,
    ExportAllDeclaration: visit,
    ExportNamedDeclaration(node) {
      if (node.source) {
        visit(node);
      }
    },
  };
}

/**
 * 타입만 당기는지. `import type { X }`와 `import { type X }` 둘 다 받는다 — 앞의 것은
 * 선언이, 뒤의 것은 지정자마다 꼴을 든다. 지정자가 없는 `import "..."`는 부작용을 위해
 * 당기는 것이라 타입이 아니다.
 */
export function isTypeOnly(node) {
  if (node.importKind === "type" || node.exportKind === "type") {
    return true;
  }

  const specifiers = node.specifiers ?? [];

  if (specifiers.length === 0) {
    return false;
  }

  return specifiers.every(
    (specifier) =>
      (specifier.type === "ImportSpecifier" &&
        specifier.importKind === "type") ||
      (specifier.type === "ExportSpecifier" && specifier.exportKind === "type"),
  );
}
