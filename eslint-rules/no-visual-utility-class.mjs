import { classStringVisitor, utilityOf } from "./class-strings.mjs";

/**
 * 화면 파일이 색·글자·모양을 직접 적는 것을 막는다. 근거는 `docs/2-design/spec/ui-kit.md`의
 * AC-03이다 — 화면 스물이 같은 카드와 버튼을 각자 그리면 스무 번 다르게 그려진다.
 */

/**
 * 규칙이 무는 두 층이다. 켜는 자리는 `src/**` 전체고 실제로 무는 자리는 여기다 —
 * `src/shared/ui/**`는 조각이 사는 자리라 규칙 밖이고, `src/app/_catalog*`는 그 조각을
 * 늘어놓는 자리라 역시 밖이다.
 */
const TARGET_LAYERS = ["/src/screens/", "/src/features/"];

const VISUAL_PREFIXES = ["bg-", "font-", "rounded-", "shadow-", "border-"];

const VISUAL_BARE = new Set(["rounded", "shadow", "border"]);

/**
 * `text-`는 크기와 색만 시각이다. 글자를 어디에 세우고 어떻게 흘릴지는 배치라 통과한다.
 */
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
