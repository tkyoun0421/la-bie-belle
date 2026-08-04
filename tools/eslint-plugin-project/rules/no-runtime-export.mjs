import { loadContract } from "../lib/contract.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const FUNCTION_LIKE_INITIALIZERS = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
  "ClassExpression",
]);

const TYPE_ONLY_DECLARATIONS = new Set([
  "TSTypeAliasDeclaration",
  "TSInterfaceDeclaration",
  "TSModuleDeclaration",
  "TSDeclareFunction",
]);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "단위 테스트를 면제하는 세그먼트는 런타임 코드를 둘 수 없다. 면제가 우회 통로가 되지 않게 한다.",
    },
    messages: {
      runtimeExport:
        "{{segment}} 세그먼트는 런타임 값을 export할 수 없습니다. 이 세그먼트는 단위 테스트가 면제되므로 로직을 두면 검증 없이 통과합니다. 로직은 model 또는 lib으로 옮기세요.",
      constantsOnly:
        "{{segment}} 세그먼트는 상수만 export할 수 있습니다. 함수와 클래스는 단위 테스트가 필요한 로직이므로 model 또는 lib으로 옮기세요.",
    },
    schema: [],
  },
  create(context) {
    const contract = loadContract(context.cwd);
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null || location.segment === null) {
      return {};
    }
    if (contract.isExemptPath(location.relative)) {
      return {};
    }

    const definition = contract.segment(location.segment);
    if (definition === null || definition.runtimeExports === true) {
      return {};
    }

    const constantsOnly = definition.runtimeExports === "constants";

    const report = (node, messageId = "runtimeExport") => {
      context.report({ node, messageId, data: { segment: location.segment } });
    };

    const isAllowedConstant = (declaration) => {
      if (!constantsOnly || declaration.type !== "VariableDeclaration") {
        return false;
      }
      return declaration.declarations.every(
        (declarator) =>
          declarator.init === null || !FUNCTION_LIKE_INITIALIZERS.has(declarator.init.type),
      );
    };

    return {
      ExportNamedDeclaration(node) {
        if (node.exportKind === "type") {
          return;
        }
        if (node.declaration === null) {
          const hasValueSpecifier = node.specifiers.some(
            (specifier) => specifier.exportKind !== "type",
          );
          if (hasValueSpecifier) {
            report(node);
          }
          return;
        }
        if (
          TYPE_ONLY_DECLARATIONS.has(node.declaration.type) ||
          isAllowedConstant(node.declaration)
        ) {
          return;
        }
        if (constantsOnly && node.declaration.type === "VariableDeclaration") {
          report(node, "constantsOnly");
          return;
        }
        report(node, constantsOnly ? "constantsOnly" : "runtimeExport");
      },
      ExportDefaultDeclaration(node) {
        report(node);
      },
      ExportAllDeclaration(node) {
        if (node.exportKind !== "type") {
          report(node);
        }
      },
    };
  },
};
