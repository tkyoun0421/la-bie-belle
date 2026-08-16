import { resolveLocation } from "../lib/resolve-path.mjs";

const SPACING_PREFIXES = [
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "p",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "m",
  "gap-x",
  "gap-y",
  "gap",
  "space-x",
  "space-y",
];

const DOCUMENTED_STEPS = new Set([
  "0",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
]);
const PURPOSE_TOKENS = new Set(["nav-safe", "nav-action-safe"]);

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

function splitSpacingUtility(token) {
  for (const prefix of SPACING_PREFIXES) {
    if (token.startsWith(`${prefix}-`)) {
      return { prefix, value: token.slice(prefix.length + 1) };
    }
  }
  return null;
}

function classifySpacingToken(token) {
  const stripped = stripModifiers(token);
  if (stripped.startsWith("-")) {
    return null;
  }
  const utility = splitSpacingUtility(stripped);
  if (utility === null) {
    return null;
  }
  const { value } = utility;
  if (value.startsWith("[")) {
    return value.includes("env(") ? null : "arbitraryValue";
  }
  if (DOCUMENTED_STEPS.has(value) || PURPOSE_TOKENS.has(value)) {
    return null;
  }
  if (/^[0-9]+(?:\.[0-9]+)?$/.test(value)) {
    return "outOfScale";
  }
  return null;
}

function checkText(context, node, text) {
  for (const token of text.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const messageId = classifySpacingToken(token);
    if (messageId !== null) {
      context.report({ node, messageId, data: { token } });
    }
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "src/ 안에서 FOUNDATIONS 간격 표 밖의 간격값을 차단한다. 크기 계열은 대상이 아니다.",
    },
    messages: {
      outOfScale:
        "간격 '{{token}}'은 FOUNDATIONS 간격 표에 없습니다. 표의 값(0·0.5·1·1.5·2·2.5·3·4·5·6·8·10·12)을 쓰거나, 새 값이 필요하면 이름과 근거를 FOUNDATIONS에 먼저 만드세요.",
      arbitraryValue:
        "임의 간격값 '{{token}}'을 쓰지 마세요. FOUNDATIONS 간격 표의 값이나 목적 토큰(nav-safe·nav-action-safe)을 쓰세요.",
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
