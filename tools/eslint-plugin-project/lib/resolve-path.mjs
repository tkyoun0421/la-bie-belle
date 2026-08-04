const SOURCE_ROOT = "src";

function toPosix(value) {
  return value.split("\\").join("/");
}

export function toSourceRelative(filePath, cwd) {
  const normalized = toPosix(filePath);
  const root = toPosix(cwd).replace(/\/$/, "");
  const relative = normalized.startsWith(`${root}/`)
    ? normalized.slice(root.length + 1)
    : normalized;
  return relative.startsWith(`${SOURCE_ROOT}/`) ? relative : null;
}

export function resolveLocation(filePath, cwd) {
  const relative = toSourceRelative(filePath, cwd);
  if (relative === null) {
    return null;
  }

  const segments = relative.slice(SOURCE_ROOT.length + 1).split("/");
  const file = segments.pop();
  const layer = segments.shift() ?? null;

  if (layer === null || file === undefined || file === "") {
    return null;
  }

  const base = { relative, layer, slice: null, segment: null, file };

  if (layer === "app") {
    return base;
  }

  if (layer === "shared") {
    return { ...base, segment: segments[0] ?? null };
  }

  return { ...base, slice: segments[0] ?? null, segment: segments[1] ?? null };
}
