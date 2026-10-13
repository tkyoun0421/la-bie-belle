import path from "node:path";

const SOURCE_ROOT = "src/";
const ALIAS = "@/";
const SLICED_LAYERS = new Set(["entities", "features", "screens"]);

export const SUPABASE_INSTANCE_MODULE = "@/shared/api/supabase";

export const UI_SEGMENT = "ui";
export const HOOKS_SEGMENT = "hooks";
export const SERVICES_SEGMENT = "services";
export const STORES_SEGMENT = "stores";
export const API_SEGMENT = "api";
export const MODEL_SEGMENT = "model";
export const CONSTS_SEGMENT = "consts";
export const CONFIG_SEGMENT = "config";
export const LIB_SEGMENT = "lib";
export const UTILS_SEGMENT = "utils";

export const SEGMENTS = Object.freeze([
  UI_SEGMENT,
  HOOKS_SEGMENT,
  SERVICES_SEGMENT,
  STORES_SEGMENT,
  API_SEGMENT,
  MODEL_SEGMENT,
  CONSTS_SEGMENT,
  CONFIG_SEGMENT,
  LIB_SEGMENT,
  UTILS_SEGMENT,
]);

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

export function specifierLocation(specifier) {
  if (typeof specifier !== "string" || !specifier.startsWith(ALIAS)) {
    return null;
  }

  return locationOf(specifier.slice(ALIAS.length).split("/"));
}

function isRelative(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

export function importedLocation(context, specifier) {
  if (typeof specifier !== "string") {
    return null;
  }

  if (!isRelative(specifier)) {
    return specifierLocation(specifier);
  }

  const resolved = path
    .relative(
      context.cwd,
      path.resolve(path.dirname(context.filename), specifier),
    )
    .split(path.sep)
    .join("/");

  if (!resolved.startsWith(SOURCE_ROOT)) {
    return null;
  }

  return locationOf(resolved.slice(SOURCE_ROOT.length).split("/"));
}

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
