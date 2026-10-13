import { HOOKS_SEGMENT, fileLocation } from "./segments.mjs";

const HOOK_NAME = /^use[A-Z]/;
const TYPE_DECLARATIONS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
]);

function exportedNameOf(specifier) {
  const { exported } = specifier;

  if (exported.type === "Identifier") {
    return exported.name;
  }

  return typeof exported.value === "string" ? exported.value : null;
}

function declaredNames(declaration) {
  if (TYPE_DECLARATIONS.has(declaration.type) || declaration.declare) {
    return [];
  }

  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.map((declarator) => ({
      node: declarator.id,
      name: declarator.id.type === "Identifier" ? declarator.id.name : null,
    }));
  }

  return [{ node: declaration, name: declaration.id?.name ?? null }];
}

function specifiedNames(specifiers) {
  return specifiers
    .filter((specifier) => specifier.exportKind !== "type")
    .map((specifier) => ({ node: specifier, name: exportedNameOf(specifier) }));
}

function exportedValues(node) {
  if (node.exportKind === "type") {
    return [];
  }

  if (node.declaration) {
    return declaredNames(node.declaration);
  }

  return specifiedNames(node.specifiers ?? []);
}

const hooksExportUseOnly = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`hooks/`가 `use*`가 아닌 값을 내보내는 것을 막는다. 타입 export는 통과한다.",
    },
    schema: [],
    messages: {
      notHook:
        "'{{name}}' 는 훅이 아닌데 `hooks/`에서 나간다. `hooks/`는 controller의 자리라 `use*`만 내보낸다 — 순수 판정은 `model/<이름>.policy.ts`, 부작용을 내는 손은 `lib/<이름>.lib.ts`, 정해진 값은 `consts/`로 보내라.",
    },
  },
  create(context) {
    if (fileLocation(context)?.segment !== HOOKS_SEGMENT) {
      return {};
    }

    function report(node, name) {
      context.report({
        node,
        messageId: "notHook",
        data: { name: name ?? "export" },
      });
    }

    return {
      ExportNamedDeclaration(node) {
        for (const { node: target, name } of exportedValues(node)) {
          if (name === null || !HOOK_NAME.test(name)) {
            report(target, name);
          }
        }
      },
      ExportAllDeclaration(node) {
        if (node.exportKind !== "type") {
          report(node, node.exported?.name ?? "*");
        }
      },
      ExportDefaultDeclaration(node) {
        const name = node.declaration.id?.name ?? null;

        if (name === null || !HOOK_NAME.test(name)) {
          report(node, name ?? "default");
        }
      },
    };
  },
};

export default hooksExportUseOnly;
