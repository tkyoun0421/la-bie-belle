import { resolveLocation } from "../lib/resolve-path.mjs";

const NAMED_PALETTE_COLORS =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const BRACKET_COLOR_START_PATTERN = new RegExp(
  `^[a-z][a-z-]*-\\[(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\(|oklch\\(|var\\(--raw-)`,
);
const SHADED_PALETTE_PATTERN = new RegExp(`^[a-z][a-z-]*-(?:${NAMED_PALETTE_COLORS})-[0-9]+$`);
const BLACK_WHITE_PATTERN = /^[a-z][a-z-]*-(?:white|black)$/;
const BARE_HEX_PATTERN = /^#[0-9a-fA-F]{3,4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/;
const BARE_FUNCTION_COLOR_PATTERN = /^(?:rgba?|hsla?|oklch)\(/i;

function stripModifiers(token) {
  let value = token.split(":").pop() ?? token;
  if (value.startsWith("!")) {
    value = value.slice(1);
  }
  if (value.endsWith("!")) {
    value = value.slice(0, -1);
  }
  return value.replace(/\/[0-9]+$/, "");
}

function classifyClassToken(token) {
  const stripped = stripModifiers(token);
  if (BRACKET_COLOR_START_PATTERN.test(stripped)) {
    return "arbitraryColor";
  }
  if (SHADED_PALETTE_PATTERN.test(stripped) || BLACK_WHITE_PATTERN.test(stripped)) {
    return "defaultPalette";
  }
  return null;
}

function isBareColorValue(token) {
  return BARE_HEX_PATTERN.test(token) || BARE_FUNCTION_COLOR_PATTERN.test(token);
}

function findEnclosingJSXAttributeName(ancestors) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (ancestors[index].type === "JSXAttribute") {
      return ancestors[index].name?.name ?? null;
    }
  }
  return null;
}

function checkText(context, node, text, isStyleContext) {
  for (const token of text.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    if (isStyleContext && isBareColorValue(token)) {
      context.report({ node, messageId: "arbitraryColor", data: { token } });
      continue;
    }
    const messageId = classifyClassToken(token);
    if (messageId !== null) {
      context.report({ node, messageId, data: { token } });
    }
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "src/ 안에서 임의 색상값과 Tailwind 기본 팔레트 유틸을 차단한다 (DEV-TOKEN-01).",
    },
    messages: {
      arbitraryColor:
        "임의 색상값 '{{token}}'을 쓰지 마세요 (DEV-TOKEN-01). globals.css의 @theme 의미 토큰 유틸을 쓰세요.",
      defaultPalette:
        "Tailwind 기본 팔레트 클래스 '{{token}}'을 쓰지 마세요 (DEV-TOKEN-01). globals.css의 @theme 의미 토큰 유틸을 쓰세요.",
    },
    schema: [],
  },
  create(context) {
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null) {
      return {};
    }

    const sourceCode = context.sourceCode;

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          const isStyleContext = findEnclosingJSXAttributeName(sourceCode.getAncestors(node)) === "style";
          checkText(context, node, node.value, isStyleContext);
        }
      },
      TemplateElement(node) {
        const isStyleContext = findEnclosingJSXAttributeName(sourceCode.getAncestors(node)) === "style";
        checkText(context, node, node.value.raw, isStyleContext);
      },
    };
  },
};
