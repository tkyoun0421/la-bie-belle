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
