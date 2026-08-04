const ALLOWED_DIRECTIVES = [
  /^\s*eslint\b/,
  /^\s*eslint-(disable|enable)/,
  /^\s*global\s/,
  /^\s*globals\s/,
  /^\s*@ts-(expect-error|ignore|nocheck)\b/,
  /^\s*prettier-ignore\b/,
  /^\s*#!/,
];

function isDirective(comment) {
  return ALLOWED_DIRECTIVES.some((pattern) => pattern.test(comment.value));
}

function isJsDoc(comment) {
  return comment.type === "Block" && comment.value.startsWith("*");
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "코드에 설명 주석과 JSDoc을 쓰지 않는다 (DEV-CODE-07). 의도는 이름과 구조로 드러내고 근거는 RADIO와 handoff가 소유한다.",
    },
    messages: {
      noComment:
        "설명 주석을 쓰지 않습니다 (DEV-CODE-07). 의도가 드러나지 않으면 주석 대신 이름과 구조를 고치고, 설계 근거는 RADIO나 handoff에 남기세요.",
      noJsDoc:
        "JSDoc 블록을 쓰지 않습니다 (DEV-CODE-07). 타입은 TypeScript가, 근거는 RADIO와 handoff가 소유합니다.",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === "Shebang" || isDirective(comment)) {
            continue;
          }
          context.report({
            loc: comment.loc,
            messageId: isJsDoc(comment) ? "noJsDoc" : "noComment",
          });
        }
      },
    };
  },
};
