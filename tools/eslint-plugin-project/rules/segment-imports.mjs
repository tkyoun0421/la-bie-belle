import { loadContract } from "../lib/contract.mjs";
import { matchesImportPattern } from "../lib/glob.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

export default {
  meta: {
    type: "problem",
    docs: { description: "세그먼트별 import 제약을 강제한다 (DEV-ARCH-02, DEV-CODE-02)." },
    messages: {
      forbiddenImport:
        "{{segment}} 세그먼트는 '{{source}}'를 import할 수 없습니다. config/fsd.json의 forbidImports가 '{{pattern}}'를 막고 있습니다.",
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
    if (definition === null || definition.forbidImports.length === 0) {
      return {};
    }

    const check = (node, source) => {
      const pattern = definition.forbidImports.find((candidate) =>
        matchesImportPattern(candidate, source),
      );
      if (pattern !== undefined) {
        context.report({
          node,
          messageId: "forbiddenImport",
          data: { segment: location.segment, source, pattern },
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
