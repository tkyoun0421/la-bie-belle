import {
  arbitraryValuesOf,
  classStringVisitor,
  segmentsOf,
} from "./class-strings.mjs";

const CUSTOM_PROPERTY = /--[A-Za-z0-9_-]+/g;
const COLOR_LITERAL =
  /#[0-9a-f]{3,8}(?![0-9a-f])|\b(?:rgba?|hsla?|oklch|oklab|lch|lab)\(/i;
const SIZE_LITERAL =
  /(?:^|[^a-z0-9_.])\d*\.?\d+(?:px|rem|em|ch|ex|vh|vw|vmin|vmax|pt|pc|in|cm|mm|%)\b/i;

function beyondTokens(value) {
  return value.replace(CUSTOM_PROPERTY, "");
}

function hasLiteral(value) {
  const remainder = beyondTokens(value);
  return COLOR_LITERAL.test(remainder) || SIZE_LITERAL.test(remainder);
}

function literalIn(classToken) {
  return segmentsOf(classToken)
    .flatMap((segment) => arbitraryValuesOf(segment))
    .some(hasLiteral);
}

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
        "'{{token}}' 은 대괄호 안에 값을 직접 적었다. docs/2-design/design-system/tokens.md 의 유틸을 쓰거나 var()·--spacing() 을 거쳐라.",
    },
  },
  create(context) {
    return classStringVisitor((classToken, node) => {
      if (!literalIn(classToken)) {
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
