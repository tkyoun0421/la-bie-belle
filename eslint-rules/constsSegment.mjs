import path from "node:path";
import { API_SEGMENT, fileLocation } from "./segments.mjs";

const CONSTS_SEGMENT = "consts";
const LIB_SEGMENT = "lib";
const TESTS_FOLDER = "__tests__";

const SETTLED_NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

const SEGMENTS_THAT_OWN_THEIR_VALUES = new Set([
  CONSTS_SEGMENT,
  API_SEGMENT,
  LIB_SEGMENT,
]);

function isPlainTypeScript(filename) {
  return filename.endsWith(".ts");
}

function isPairTest(filename) {
  return filename.split(path.sep).includes(TESTS_FOLDER);
}

function exportedNameOf(specifier) {
  const exported = specifier.exported;

  if (!exported) {
    return null;
  }

  return exported.type === "Identifier" ? exported.name : exported.value;
}

const constsSegment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`consts` 세그먼트 밖에서 대문자 스네이크 이름을 내보내는 것을 막는다. `.ts`만 보고 `api`·`lib` 세그먼트와 짝 테스트는 밖이다.",
    },
    schema: [],
    messages: {
      settled:
        "'{{name}}' 는 정해진 값이다. `consts/<슬라이스>.const.ts`가 그것을 들고, 이 파일은 거기서 import해 써라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (
      !here ||
      !isPlainTypeScript(context.filename) ||
      isPairTest(context.filename) ||
      SEGMENTS_THAT_OWN_THEIR_VALUES.has(here.segment)
    ) {
      return {};
    }

    function report(node, name) {
      if (typeof name !== "string" || !SETTLED_NAME.test(name)) {
        return;
      }

      context.report({ node, messageId: "settled", data: { name } });
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.exportKind === "type") {
          return;
        }

        if (node.declaration) {
          if (
            node.declaration.type !== "VariableDeclaration" ||
            node.declaration.kind !== "const"
          ) {
            return;
          }

          for (const declarator of node.declaration.declarations) {
            if (declarator.id.type === "Identifier") {
              report(declarator.id, declarator.id.name);
            }
          }

          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.exportKind === "type") {
            continue;
          }

          report(specifier, exportedNameOf(specifier));
        }
      },
    };
  },
};

export default constsSegment;
