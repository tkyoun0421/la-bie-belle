import { loadContract } from "../lib/contract.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const SERVER_ONLY = "server-only";

export default {
  meta: {
    type: "problem",
    docs: { description: "서버 모듈은 첫 import로 server-only를 선언한다 (DEV-ARCH-03)." },
    messages: {
      missingServerOnly:
        '{{segment}} 세그먼트의 모듈은 첫 줄에 import "server-only"를 선언해야 합니다. 선언이 없으면 이 코드가 클라이언트 번들에 들어가도 빌드가 막지 못합니다.',
      notFirstImport:
        'import "server-only"는 첫 import여야 합니다. 뒤에 두면 앞선 import가 먼저 평가되어 경계가 늦게 세워집니다.',
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
    if (definition === null || !definition.requireServerOnly) {
      return {};
    }

    return {
      Program(node) {
        const imports = node.body.filter((statement) => statement.type === "ImportDeclaration");
        const position = imports.findIndex((statement) => statement.source.value === SERVER_ONLY);

        if (position === -1) {
          context.report({
            node,
            messageId: "missingServerOnly",
            data: { segment: location.segment },
          });
          return;
        }
        if (position !== 0) {
          context.report({ node: imports[position], messageId: "notFirstImport" });
        }
      },
    };
  },
};
