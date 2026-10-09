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

const ENTRIES = [
  "src/entities/notification/utils/pushMessage.utils.ts",
  "src/entities/notification/model/pushResult.policy.ts",
  "src/features/holiday/model/holiday.schema.ts",
  "src/features/holiday/utils/holiday.mapper.ts",
];

const FOLDERS = [
  { from: "src/entities/notification/consts", to: "notification" },
  { from: "src/entities/notification/model", to: "notification" },
  { from: "src/entities/notification/utils", to: "notification" },
  { from: "src/features/holiday/model", to: "holiday" },
  { from: "src/features/holiday/utils", to: "holiday" },
];

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])([^'"]+)\2/g;

function targetOf(source: string): string {
  const folder = FOLDERS.find((one) => source.startsWith(`${one.from}/`));

  if (folder === undefined) {
    throw new Error(
      `${source} 를 옮길 자리가 없다. scripts/syncEdgeShared.mts 의 FOLDERS 에 그 폴더를 더해라.`,
    );
  }

  return path.posix.join(folder.to, source.slice(folder.from.length + 1));
}

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
