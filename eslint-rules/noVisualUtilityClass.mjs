import { classStringVisitor, utilityOf } from "./classStrings.mjs";

const TARGET_LAYERS = ["/src/screens/", "/src/features/"];

const VISUAL_PREFIXES = ["bg-", "font-", "rounded-", "shadow-", "border-"];

const VISUAL_BARE = new Set(["rounded", "shadow", "border"]);

const TEXT_LAYOUT_SUFFIXES = new Set([
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
  "wrap",
  "nowrap",
  "balance",
  "pretty",
  "ellipsis",
  "clip",
]);

function isVisual(utility) {
  if (VISUAL_BARE.has(utility)) {
    return true;
  }

  if (utility.startsWith("text-")) {
    return !TEXT_LAYOUT_SUFFIXES.has(utility.slice("text-".length));
  }

  return VISUAL_PREFIXES.some((prefix) => utility.startsWith(prefix));
}

function isTargetFile(filename) {
  const posix = filename.replace(/\\/g, "/");

  return TARGET_LAYERS.some((layer) => posix.includes(layer));
}

const noVisualUtilityClass = {
  meta: {
    type: "problem",
    docs: {
      description:
        "화면 파일이 색·글자·모양 유틸리티를 직접 적는 것을 막는다. 디자인이 한 곳에서만 바뀌게 하려는 것이다.",
    },
    schema: [],
    messages: {
      visual:
        "'{{token}}' 은 화면 파일이 정할 값이 아니다. 색·글자·모양은 `src/shared/ui`의 조각이 든다.",
    },
  },
  create(context) {
    if (!isTargetFile(context.filename)) {
      return {};
    }

    return classStringVisitor((classToken, node) => {
      if (!isVisual(utilityOf(classToken))) {
        return;
      }

      context.report({
        node,
        messageId: "visual",
        data: { token: classToken },
      });
    });
  },
};

export default noVisualUtilityClass;
