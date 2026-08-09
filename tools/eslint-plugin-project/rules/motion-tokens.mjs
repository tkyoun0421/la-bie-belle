import { resolveLocation } from "../lib/resolve-path.mjs";

const LAYOUT_PROPERTIES = new Set([
  "all",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "block-size",
  "inline-size",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "margin",
  "padding",
  "border-width",
  "font-size",
  "line-height",
  "flex",
  "flex-basis",
  "grid-template-columns",
  "grid-template-rows",
]);

const TIME_UTILITIES = new Set(["duration", "delay"]);
const EASING_UTILITIES = new Set(["ease"]);

const TIME_STYLE_PROPERTIES = new Set([
  "transitionDuration",
  "transitionDelay",
  "animationDuration",
  "animationDelay",
]);
const EASING_STYLE_PROPERTIES = new Set(["transitionTimingFunction", "animationTimingFunction"]);

const ARBITRARY_UTILITY_PATTERN = /^([a-z-]+)-\[(.+)\]$/;
const DURATION_TOKEN_PATTERN = /^var\(--duration-[a-z-]+\)$/;
const EASING_TOKEN_PATTERN = /^var\(--ease-[a-z-]+\)$/;

function stripModifiers(token) {
  let value = token.split(":").pop() ?? token;
  if (value.startsWith("!")) {
    value = value.slice(1);
  }
  if (value.endsWith("!")) {
    value = value.slice(0, -1);
  }
  return value;
}

function normalizeArbitraryValue(value) {
  return value.replaceAll("_", " ").trim();
}

function animatesLayout(properties) {
  return properties
    .split(",")
    .map((entry) => normalizeArbitraryValue(entry).toLowerCase())
    .some((entry) => LAYOUT_PROPERTIES.has(entry));
}

function classifyClassToken(token) {
  const stripped = stripModifiers(token);

  if (stripped === "transition-all") {
    return "layoutAnimation";
  }

  const arbitrary = ARBITRARY_UTILITY_PATTERN.exec(stripped);
  if (arbitrary === null) {
    return null;
  }

  const [, utility, rawValue] = arbitrary;
  const value = normalizeArbitraryValue(rawValue);

  if (utility === "transition" || utility === "animate") {
    return animatesLayout(rawValue) ? "layoutAnimation" : null;
  }
  if (TIME_UTILITIES.has(utility)) {
    return DURATION_TOKEN_PATTERN.test(value) ? null : "arbitraryMotionValue";
  }
  if (EASING_UTILITIES.has(utility)) {
    return EASING_TOKEN_PATTERN.test(value) ? null : "arbitraryMotionValue";
  }
  return null;
}

function checkText(context, node, text) {
  for (const token of text.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const messageId = classifyClassToken(token);
    if (messageId !== null) {
      context.report({ node, messageId, data: { token } });
    }
  }
}

function propertyKeyName(node) {
  if (node.key.type === "Identifier" && !node.computed) {
    return node.key.name;
  }
  if (node.key.type === "Literal" && typeof node.key.value === "string") {
    return node.key.value;
  }
  return null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "src/ 안에서 레이아웃 속성 애니메이션과 토큰 밖 모션 값을 차단한다 (DEV-TOKEN-01).",
    },
    messages: {
      layoutAnimation:
        "'{{token}}'은 레이아웃을 다시 계산시키는 속성을 애니메이션합니다 (DEV-TOKEN-01). transform과 opacity만 애니메이션하세요.",
      arbitraryMotionValue:
        "모션 임의값 '{{token}}'을 쓰지 마세요 (DEV-TOKEN-01). globals.css의 --duration-*·--ease-* 토큰을 참조하세요.",
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
      Property(node) {
        const name = propertyKeyName(node);
        if (name === null || node.value.type !== "Literal") {
          return;
        }
        if (typeof node.value.value !== "string") {
          return;
        }
        const value = node.value.value.trim();
        if (TIME_STYLE_PROPERTIES.has(name) && !DURATION_TOKEN_PATTERN.test(value)) {
          context.report({ node, messageId: "arbitraryMotionValue", data: { token: value } });
          return;
        }
        if (EASING_STYLE_PROPERTIES.has(name) && !EASING_TOKEN_PATTERN.test(value)) {
          context.report({ node, messageId: "arbitraryMotionValue", data: { token: value } });
        }
      },
    };
  },
};
