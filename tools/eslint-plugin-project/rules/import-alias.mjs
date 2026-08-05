import path from "node:path";

import { loadContract } from "../lib/contract.mjs";
import { toSourceRelative } from "../lib/resolve-path.mjs";

const SOURCE_ROOT = "src";
const ALIAS_PREFIX = "@/";

function resolveTarget(fromRelativePath, source) {
  const fromDirectory = path.posix.dirname(fromRelativePath);
  return path.posix.normalize(path.posix.join(fromDirectory, source));
}

function toAlias(resolvedPath) {
  const withoutRoot = resolvedPath.slice(SOURCE_ROOT.length + 1);
  const withoutExtension = withoutRoot.replace(/\.tsx?$/, "");
  return `${ALIAS_PREFIX}${withoutExtension}`;
}

export default {
  meta: {
    type: "problem",
    docs: { description: "src/ 안 import는 @/ alias만 쓴다 (DEV-NAME-06)." },
    fixable: "code",
    messages: {
      relativeImport: '상대경로 import 대신 @/ alias를 쓰세요 (DEV-NAME-06): "{{alias}}"',
      unresolvableImport:
        '상대경로 import를 쓰지 마세요 (DEV-NAME-06): "{{source}}"는 src/ 밖으로 벗어나 @/ alias로 표현할 수 없습니다.',
    },
    schema: [],
  },
  create(context) {
    const relativeFilePath = toSourceRelative(context.filename, context.cwd);

    if (relativeFilePath === null) {
      return {};
    }

    const contract = loadContract(context.cwd);

    const check = (sourceNode, source) => {
      if (!source.startsWith("./") && !source.startsWith("../")) {
        return;
      }

      const resolved = resolveTarget(relativeFilePath, source);

      if (!resolved.startsWith(`${SOURCE_ROOT}/`)) {
        context.report({
          node: sourceNode,
          messageId: "unresolvableImport",
          data: { source },
        });
        return;
      }

      const alias = toAlias(resolved);
      const [firstSegment] = resolved.slice(SOURCE_ROOT.length + 1).split("/");

      if (!contract.layers.includes(firstSegment)) {
        context.report({ node: sourceNode, messageId: "relativeImport", data: { alias } });
        return;
      }

      context.report({
        node: sourceNode,
        messageId: "relativeImport",
        data: { alias },
        fix: (fixer) => fixer.replaceText(sourceNode, `"${alias}"`),
      });
    };

    return {
      ImportDeclaration(node) {
        check(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node.source, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source) {
          check(node.source, node.source.value);
        }
      },
      ImportExpression(node) {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          check(node.source, node.source.value);
        }
      },
    };
  },
};
