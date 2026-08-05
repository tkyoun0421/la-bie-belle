import path from "node:path";

import { resolveLocation } from "../lib/resolve-path.mjs";

const SOURCE_ROOT = "src";
const ALIAS_PREFIX = "@/";

function toAlias(fromRelativePath, source) {
  const fromDirectory = path.posix.dirname(fromRelativePath);
  const resolved = path.posix.normalize(path.posix.join(fromDirectory, source));

  if (!resolved.startsWith(`${SOURCE_ROOT}/`)) {
    return null;
  }

  const withoutRoot = resolved.slice(SOURCE_ROOT.length + 1);
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
    },
    schema: [],
  },
  create(context) {
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null) {
      return {};
    }

    const check = (sourceNode, source) => {
      if (!source.startsWith("./") && !source.startsWith("../")) {
        return;
      }

      const alias = toAlias(location.relative, source);
      if (alias === null) {
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
