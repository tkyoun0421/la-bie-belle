const ERROR_CODE_PATTERN =
  /^(IDENTITY|SCHEDULING|ATTENDANCE|NOTIFICATIONS|PAY|COMMON)_[A-Z0-9_]+$/;
const REGISTRY_FILE_SUFFIX = "src/shared/config/error-codes.config.ts";

function isRegistryFile(filename) {
  return filename.split("\\").join("/").endsWith(REGISTRY_FILE_SUFFIX);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "정본 레지스트리 밖에서 오류 코드 접두 패턴 문자열 리터럴을 금지한다 (DEV-ERR-07).",
    },
    messages: {
      literalErrorCode:
        '"{{value}}"는 오류 코드 정본 패턴입니다. 리터럴로 쓰지 말고 ERROR_CODES의 멤버로 참조하세요.',
    },
    schema: [],
  },
  create(context) {
    if (isRegistryFile(context.filename)) {
      return {};
    }

    function check(node, value) {
      if (typeof value === "string" && ERROR_CODE_PATTERN.test(value)) {
        context.report({ node, messageId: "literalErrorCode", data: { value } });
      }
    }

    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateLiteral(node) {
        if (node.expressions.length === 0) {
          check(node, node.quasis.map((quasi) => quasi.value.cooked).join(""));
        }
      },
    };
  },
};
