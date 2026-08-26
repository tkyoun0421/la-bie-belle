import {
  arbitraryValueOf,
  classStringVisitor,
  utilityOf,
} from "./class-strings.mjs";

const THROUGH_TOKEN = /var\(|--spacing\(|--alpha\(|--value\(/;
const COLOR_LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lch|lab)\(/i;
const SIZE_LITERAL =
  /(?:^|[^a-z0-9_.-])\d*\.?\d+(?:px|rem|em|ch|ex|vh|vw|vmin|vmax|pt|pc|in|cm|mm|%)\b/i;

const noArbitraryClassValues = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Tailwind 임의 값이 토큰을 거치지 않고 색이나 크기를 직접 적는 것을 막는다.",
    },
    schema: [],
    messages: {
      hardcoded:
        "'{{token}}' 은 대괄호 안에 값을 직접 적었다. docs/design-system/tokens.md 의 유틸을 쓰거나 var()·--spacing() 을 거쳐라.",
    },
  },
  create(context) {
    return classStringVisitor((classToken, node) => {
      const value = arbitraryValueOf(utilityOf(classToken));
      if (value === null || THROUGH_TOKEN.test(value)) {
        return;
      }
      if (!COLOR_LITERAL.test(value) && !SIZE_LITERAL.test(value)) {
        return;
      }
      context.report({
        node,
        messageId: "hardcoded",
        data: { token: classToken },
      });
    });
  },
};

export default noArbitraryClassValues;
