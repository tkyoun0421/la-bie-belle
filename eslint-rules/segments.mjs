import path from "node:path";

const SOURCE_ROOT = "src/";
const ALIAS = "@/";
const SLICED_LAYERS = new Set(["entities", "features", "screens"]);

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
