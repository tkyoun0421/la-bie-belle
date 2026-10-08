import { fileLocation } from "./segments.mjs";

const APP_LAYER = "app";
const HOOK_HOMES = new Set(["hooks", "services", "stores"]);
const HOOK_NAME = /^use[A-Z]/;
const FUNCTION_DECLARATIONS = new Set([
  "FunctionDeclaration",
  "TSDeclareFunction",
]);

function exportedNameOf(specifier) {
  const { exported } = specifier;

  if (exported.type === "Identifier") {
    return exported.name;
  }

  return typeof exported.value === "string" ? exported.value : null;
}

function declaredHooks(declaration) {
  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations
      .filter(
        (declarator) =>
          declarator.id.type === "Identifier" &&
          HOOK_NAME.test(declarator.id.name),
      )
      .map((declarator) => ({
        node: declarator.id,
        name: declarator.id.name,
      }));
  }

  if (
    FUNCTION_DECLARATIONS.has(declaration.type) &&
    declaration.id &&
    HOOK_NAME.test(declaration.id.name)
  ) {
    return [{ node: declaration.id, name: declaration.id.name }];
  }

  return [];
}

function specifiedHooks(specifiers) {
  const hooks = [];

  for (const specifier of specifiers) {
    if (specifier.exportKind === "type") {
      continue;
    }

    const name = exportedNameOf(specifier);

    if (name && HOOK_NAME.test(name)) {
      hooks.push({ node: specifier, name });
    }
  }

  return hooks;
}

function exportedHooks(node) {
  if (node.exportKind === "type") {
    return [];
  }

  if (node.declaration) {
    return declaredHooks(node.declaration);
  }

  return specifiedHooks(node.specifiers ?? []);
}

const useExportSegment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`use*`를 export하는 파일이 `hooks`·`services`·`stores` 세그먼트 밖에 사는 것을 막는다.",
    },
    schema: [],
    messages: {
      hookExport:
        "'{{name}}' 는 훅이다. `use*` export는 `hooks`·`services`·`stores`만 든다 — 화면의 controller는 `hooks/`, Query·Mutation은 `services/`, zustand·Context는 `stores/`로 보내라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.layer === APP_LAYER || HOOK_HOMES.has(here.segment)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        for (const hook of exportedHooks(node)) {
          context.report({
            node: hook.node,
            messageId: "hookExport",
            data: { name: hook.name },
          });
        }
      },
    };
  },
};

export default useExportSegment;
