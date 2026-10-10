import { fileLocation } from "./segments.mjs";

const SHARED_LAYER = "shared";

const noLayerReexport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`shared` 밖의 파일이 import로 받은 이름을 다시 내보내는 것을 막는다. 쓰는 쪽이 원래 자리에서 직접 받아야 층의 셈이 맞는다.",
    },
    schema: [],
    messages: {
      fromSource:
        "'{{source}}' 의 이름을 여기서 다시 내보내지 않는다. 쓰는 쪽이 '{{source}}' 에서 직접 받아야 「이 파일이 어느 층을 당기나」를 import 문으로 셀 수 있다 — 경유지가 끼면 사람도 기계도 틀린 수를 센다.",
      importedName:
        "'{{name}}' 은 '{{source}}' 에서 받은 이름이다. 다시 내보내지 말고 쓰는 쪽이 '{{source}}' 에서 직접 받게 둬라 — 경유지가 끼면 그 파일이 당기는 층의 셈이 거짓이 된다.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (here === null || here.layer === SHARED_LAYER) {
      return {};
    }

    const sourceOfImportedName = new Map();
    const fromSourceNodes = [];
    const localExportSpecifiers = [];

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          sourceOfImportedName.set(specifier.local.name, node.source.value);
        }
      },

      ExportAllDeclaration(node) {
        fromSourceNodes.push(node);
      },

      ExportNamedDeclaration(node) {
        if (node.source) {
          fromSourceNodes.push(node);
          return;
        }

        for (const specifier of node.specifiers ?? []) {
          localExportSpecifiers.push(specifier);
        }
      },

      "Program:exit"() {
        for (const node of fromSourceNodes) {
          context.report({
            node,
            messageId: "fromSource",
            data: { source: node.source.value },
          });
        }

        for (const specifier of localExportSpecifiers) {
          const source = sourceOfImportedName.get(specifier.local.name);

          if (source === undefined) {
            continue;
          }

          context.report({
            node: specifier,
            messageId: "importedName",
            data: { name: specifier.local.name, source },
          });
        }
      },
    };
  },
};

export default noLayerReexport;
