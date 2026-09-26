// `tsconfig.json`의 `paths`를 Node의 해석기에도 알려준다.
//
// `tests/`와 `src/`는 상대 경로 import가 lint로 막혀 있어서(규칙 1) 늘 `@tests/`·`@/`로
// 서로를 가리킨다. Jest는 `moduleNameMapper`로 그 별칭을 알지만 맨 Node는 모른다 — 그래서
// `scripts/`가 그 파일들을 재사용하려면 해석 단계에 이 표를 끼워야 한다.
//
// 확장자를 붙여 보는 것은 ESM이 확장자를 안 붙인 경로를 안 찾아주기 때문이다.

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);

const ALIASES = [
  { prefix: "@tests/", dir: "tests/" },
  { prefix: "@scripts/", dir: "scripts/" },
  { prefix: "@/", dir: "src/" },
];

export function resolve(specifier, context, nextResolve) {
  const alias = ALIASES.find((entry) => specifier.startsWith(entry.prefix));

  if (!alias) {
    return nextResolve(specifier, context);
  }

  const rest = specifier.slice(alias.prefix.length);
  const candidates = [
    new URL(`${alias.dir}${rest}`, ROOT),
    new URL(`${alias.dir}${rest}.ts`, ROOT),
    new URL(`${alias.dir}${rest}/index.ts`, ROOT),
  ];
  const found = candidates.find((url) => existsSync(fileURLToPath(url)));

  return nextResolve((found ?? candidates[0]).href, context);
}
