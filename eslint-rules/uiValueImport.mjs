import {
  UI_SEGMENT,
  fileLocation,
  importEdges,
  isTypeOnly,
  specifierLocation,
} from "./segments.mjs";

const MAKING_SEGMENTS = new Set(["model", "utils"]);
const DOMAINLESS_LAYER = "shared";
const UTILS_SEGMENT = "utils";

const uiValueImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`ui/`에서 `model`·`utils`를 값으로 당기는 것을 막는다. presentation은 조립만 하고 값은 controller가 완성해 준다.",
    },
    schema: [],
    messages: {
      valueInUi:
        "'{{source}}' 를 값으로 당기면 이 화면이 값을 만드는 것이다. `ui/*.tsx`는 조립만 하고 포맷·문구·판정은 `hooks/use<조각>.ts`가 불러 완성된 값으로 내려줘라. 타입은 `import type`으로 당겨도 된다.",
    },
  },
  create(context) {
    if (fileLocation(context)?.segment !== UI_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      if (isTypeOnly(node)) {
        return;
      }

      const source = node.source.value;
      const there = specifierLocation(source);

      if (!MAKING_SEGMENTS.has(there?.segment)) {
        return;
      }

      if (there.layer === DOMAINLESS_LAYER && there.segment === UTILS_SEGMENT) {
        return;
      }

      context.report({ node, messageId: "valueInUi", data: { source } });
    });
  },
};

export default uiValueImport;
