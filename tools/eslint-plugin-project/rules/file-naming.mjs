import { loadContract } from "../lib/contract.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const USE_CAMEL_CASE = /^use[A-Z][A-Za-z0-9]*$/;

const COMPONENT_SEGMENT = "ui";
const HOOK_SEGMENT = "hooks";

function stripExtensions(fileName) {
  const [stem] = fileName.split(".");
  return stem;
}

export default {
  meta: {
    type: "problem",
    docs: { description: "폴더와 파일 이름 규칙을 강제한다 (DEV-NAME-*)." },
    messages: {
      folder: "폴더 이름 '{{name}}'이 kebab-case가 아닙니다. 예: shift-assignment.",
      componentFile:
        "ui 세그먼트의 컴포넌트 파일 '{{name}}'은 PascalCase여야 합니다. 파일 이름과 export 이름을 맞춥니다. 예: ShiftCard.tsx.",
      hookFile:
        "hooks 세그먼트의 파일 '{{name}}'은 useCamelCase여야 합니다. 파일 이름과 export 이름을 맞춥니다. 예: useShiftList.ts.",
      generalFile: "파일 이름 '{{name}}'이 kebab-case가 아닙니다. 예: format-date.ts.",
    },
    schema: [],
  },
  create(context) {
    const contract = loadContract(context.cwd);
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null) {
      return {};
    }
    if (contract.isNamingException(location.relative) || contract.isExemptPath(location.relative)) {
      return {};
    }

    return {
      Program(node) {
        const parts = location.relative.split("/");
        const directories = parts.slice(1, -1);

        for (const directory of directories) {
          if (!KEBAB_CASE.test(directory)) {
            context.report({ node, messageId: "folder", data: { name: directory } });
            return;
          }
        }

        const stem = stripExtensions(location.file);

        if (location.segment === COMPONENT_SEGMENT && location.file.endsWith(".tsx")) {
          if (!PASCAL_CASE.test(stem)) {
            context.report({ node, messageId: "componentFile", data: { name: location.file } });
          }
          return;
        }

        if (location.segment === HOOK_SEGMENT) {
          if (!USE_CAMEL_CASE.test(stem)) {
            context.report({ node, messageId: "hookFile", data: { name: location.file } });
          }
          return;
        }

        if (!KEBAB_CASE.test(stem)) {
          context.report({ node, messageId: "generalFile", data: { name: location.file } });
        }
      },
    };
  },
};
