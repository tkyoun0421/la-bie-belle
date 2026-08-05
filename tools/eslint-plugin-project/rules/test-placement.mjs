import { loadContract } from "../lib/contract.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const TEST_FILE_PATTERN = /\.(test|spec)\.[^./]+$/;

export default {
  meta: {
    type: "problem",
    docs: { description: "단위 테스트 파일의 배치 폴더와 접미사를 강제한다 (DEV-TEST-06)." },
    messages: {
      placement: "테스트 파일은 {{dir}}/{{placementDir}}/ 하위에 두세요 (DEV-TEST-06)",
      suffix: ".spec 대신 .test 접미사를 쓰세요 (DEV-TEST-06)",
    },
    schema: [],
  },
  create(context) {
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null) {
      return {};
    }

    const match = TEST_FILE_PATTERN.exec(location.file);
    if (match === null) {
      return {};
    }

    const contract = loadContract(context.cwd);
    const { directory, suffix } = contract.testPlacement;
    const allowedSuffixName = suffix.replace(/^\./, "");

    return {
      Program(node) {
        if (match[1] !== allowedSuffixName) {
          context.report({ node, messageId: "suffix" });
        }

        const parts = location.relative.split("/");
        const parentDirectory = parts[parts.length - 2];
        if (parentDirectory !== directory) {
          const dir = parts.slice(0, -1).join("/");
          context.report({
            node,
            messageId: "placement",
            data: { dir, placementDir: directory },
          });
        }
      },
    };
  },
};
