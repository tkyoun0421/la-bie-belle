import path from "node:path";

const ALIAS_PREFIX = "@/";
const SOURCE_ROOT = "src";

function toPosix(value) {
  return value.split("\\").join("/");
}

export function resolveImportTarget(source, fromRelativePath) {
  if (source.startsWith(ALIAS_PREFIX)) {
    const segments = source.slice(ALIAS_PREFIX.length).split("/");
    return { layer: segments[0] ?? null, slice: segments[1] ?? null, segment: segments[2] ?? null };
  }

  if (!source.startsWith(".")) {
    return null;
  }

  const fromDirectory = path.posix.dirname(toPosix(fromRelativePath));
  const resolved = path.posix.normalize(path.posix.join(fromDirectory, source));

  if (!resolved.startsWith(`${SOURCE_ROOT}/`)) {
    return null;
  }

  const segments = resolved.slice(SOURCE_ROOT.length + 1).split("/");
  return { layer: segments[0] ?? null, slice: segments[1] ?? null, segment: segments[2] ?? null };
}
