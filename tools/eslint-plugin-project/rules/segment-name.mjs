import { loadContract } from "../lib/contract.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

export default {
  meta: {
    type: "problem",
    docs: { description: "세그먼트 이름은 config/fsd.json에 정의된 것만 쓴다 (DEV-ARCH-05)." },
    messages: {
      unknownSegment:
        "'{{segment}}'는 config/fsd.json에 없는 세그먼트입니다. 허용되는 이름: {{allowed}}. 새 세그먼트가 필요하면 계약 파일에 규칙과 함께 추가하세요.",
    },
    schema: [],
  },
  create(context) {
    const contract = loadContract(context.cwd);
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null || location.layer === "app" || location.segment === null) {
      return {};
    }
    if (contract.isExemptPath(location.relative) || contract.segment(location.segment) !== null) {
      return {};
    }

    return {
      Program(node) {
        context.report({
          node,
          messageId: "unknownSegment",
          data: { segment: location.segment, allowed: contract.segmentNames.join(", ") },
        });
      },
    };
  },
};
