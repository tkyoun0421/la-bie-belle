const FAILURE_COPY = "보내지 못했어요. 다시 시도해주세요";

const CANON_FILE = "src/shared/consts/error.const.ts";

const CANON_IMPORT = "@/shared/consts/error.const";

function isCanonFile(context) {
  return context.filename.replaceAll("\\", "/").endsWith(CANON_FILE);
}

const noDuplicateFailureCopy = {
  meta: {
    type: "problem",
    docs: {
      description: `통신 실패 문안 「${FAILURE_COPY}」를 ${CANON_FILE} 밖에서 다시 적는 것을 막는다. 같은 실패에 다른 말이 나가지 않게 글자가 한 자리에만 산다.`,
    },
    schema: [],
    messages: {
      duplicate: `통신 실패 문안을 여기에 다시 적었다. '${CANON_IMPORT}' 의 TRANSPORT_ERROR_COPY 를 가리켜라 — 글자가 여러 집에 살면 문안을 다듬는 날 하나를 놓쳐 같은 실패에 다른 말이 나간다.`,
    },
  },
  create(context) {
    if (isCanonFile(context)) {
      return {};
    }

    function reportIfCopy(node, text) {
      if (typeof text !== "string" || !text.includes(FAILURE_COPY)) {
        return;
      }

      context.report({ node, messageId: "duplicate" });
    }

    return {
      Literal(node) {
        reportIfCopy(node, node.value);
      },

      TemplateElement(node) {
        reportIfCopy(node, node.value.cooked ?? node.value.raw);
      },

      JSXText(node) {
        reportIfCopy(node, node.value);
      },
    };
  },
};

export default noDuplicateFailureCopy;
