import { classStringVisitor, utilityOf } from "./class-strings.mjs";

const DEFAULT_PALETTES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "stone",
];

const STEPPED = new RegExp(
  `^-?[a-z]+(?:-[a-z]+)*-(?:${DEFAULT_PALETTES.join("|")})-(?:50|\\d{3})(?:\\/(?:\\d+|\\[[^\\]]*\\]))?$`,
);
const ACHROMATIC =
  /^-?[a-z]+(?:-[a-z]+)*-(?:white|black)(?:\/(?:\d+|\[[^\]]*\]))?$/;

const noDefaultPaletteClass = {
  meta: {
    type: "problem",
    docs: {
      description: "우리 팔레트에 없는 Tailwind 기본 색 유틸리티를 막는다.",
    },
    schema: [],
    messages: {
      outsidePalette:
        "'{{token}}' 은 Tailwind 기본 팔레트다. docs/2-design/design-system/tokens.md 의 역할 토큰 유틸을 써라.",
    },
  },
  create(context) {
    return classStringVisitor((classToken, node) => {
      const utility = utilityOf(classToken);
      if (!STEPPED.test(utility) && !ACHROMATIC.test(utility)) {
        return;
      }
      context.report({
        node,
        messageId: "outsidePalette",
        data: { token: classToken },
      });
    });
  },
};

export default noDefaultPaletteClass;
