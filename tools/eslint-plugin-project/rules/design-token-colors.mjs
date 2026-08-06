import { resolveLocation } from "../lib/resolve-path.mjs";

const ARBITRARY_COLOR_PATTERN = /^[a-z][a-z-]*-\[(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\()/;
const SHADED_PALETTE_PATTERN =
  /^[a-z][a-z-]*-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]+$/;
const BLACK_WHITE_PATTERN = /^[a-z][a-z-]*-(?:white|black)$/;

function stripVariants(token) {
  const segments = token.split(":");
  return segments[segments.length - 1] ?? token;
}

function classifyToken(token) {
  const stripped = stripVariants(token);
  if (ARBITRARY_COLOR_PATTERN.test(stripped)) {
    return "arbitraryColor";
  }
  if (SHADED_PALETTE_PATTERN.test(stripped) || BLACK_WHITE_PATTERN.test(stripped)) {
    return "defaultPalette";
  }
  return null;
}

function checkText(context, node, text) {
  for (const token of text.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const messageId = classifyToken(token);
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

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkText(context, node, node.value);
        }
      },
      TemplateElement(node) {
        checkText(context, node, node.value.raw);
      },
    };
  },
};
