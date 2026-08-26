const HEX_COLOR = /(?:^|[^&\w])#[0-9a-f]{3}(?:[0-9a-f]{3}(?:[0-9a-f]{2})?)?\b/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|lch|lab)\(\s*[\d.]/i;

const noColorLiterals = {
  meta: {
    type: "problem",
    docs: {
      description: "코드에 색값을 직접 적는 것을 막는다.",
    },
    schema: [],
    messages: {
      literal:
        "색값 '{{value}}' 를 코드에 직접 적었다. docs/design-system/tokens.md 의 역할 토큰을 써라.",
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== "string") {
          return;
        }
        if (!HEX_COLOR.test(node.value) && !COLOR_FUNCTION.test(node.value)) {
          return;
        }
        context.report({
          node,
          messageId: "literal",
          data: { value: node.value },
        });
      },
    };
  },
};

export default noColorLiterals;
