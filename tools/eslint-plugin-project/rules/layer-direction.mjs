import { loadContract } from "../lib/contract.mjs";
import { resolveImportTarget } from "../lib/import-target.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const SLICELESS_LAYERS = new Set(["app", "shared"]);

export default {
  meta: {
    type: "problem",
    docs: { description: "FSD 계층 의존은 위에서 아래로만 향한다 (DEV-ARCH-01, DEV-CODE-03)." },
    messages: {
      wrongDirection:
        "{{from}} 계층은 {{to}} 계층을 import할 수 없습니다. 의존은 config/fsd.json의 layers 순서대로 위에서 아래로만 향합니다.",
      sameLayer:
        "같은 {{from}} 계층의 다른 슬라이스({{slice}})를 직접 import할 수 없습니다. 공통 코드는 하위 계층으로 내리세요.",
    },
    schema: [],
  },
  create(context) {
    const contract = loadContract(context.cwd);
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null) {
      return {};
    }

    const check = (node, source) => {
      const target = resolveImportTarget(source, location.relative);
      if (target === null || target.layer === null) {
        return;
      }
      if (contract.layerRank(target.layer) === null) {
        return;
      }

      if (target.layer === location.layer) {
        if (SLICELESS_LAYERS.has(location.layer) || target.slice === location.slice) {
          return;
        }
        context.report({
          node,
          messageId: "sameLayer",
          data: { from: location.layer, slice: target.slice },
        });
        return;
      }

      if (!contract.canImport(location.layer, target.layer)) {
        context.report({
          node,
          messageId: "wrongDirection",
          data: { from: location.layer, to: target.layer },
        });
      }
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source) {
          check(node, node.source.value);
        }
      },
    };
  },
};
