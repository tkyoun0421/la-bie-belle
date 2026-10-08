import {
  SERVICES_SEGMENT,
  UI_SEGMENT,
  fileLocation,
  importEdges,
  specifierLocation,
} from "./segments.mjs";

const FEATURES_LAYER = "features";

const noServicesImportInUi = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`features/*/ui`를 뺀 `ui` 세그먼트가 `services` 세그먼트를 import하는 것을 막는다.",
    },
    schema: [],
    messages: {
      services:
        "'{{source}}' 는 service다. 이 화면의 `hooks/use<화면>.ts`가 controller로 그것을 부르고 `.tsx`는 돌려받은 것을 그려라.",
      otherSlice:
        "'{{source}}' 는 다른 슬라이스의 service다. `features/*/ui`가 부를 수 있는 것은 자기 use case의 service뿐이다.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.segment !== UI_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source.value;
      const there = specifierLocation(source);

      if (there?.segment !== SERVICES_SEGMENT) {
        return;
      }

      if (here.layer !== FEATURES_LAYER) {
        context.report({
          node: node.source,
          messageId: "services",
          data: { source },
        });
        return;
      }

      if (there.layer !== FEATURES_LAYER || there.slice !== here.slice) {
        context.report({
          node: node.source,
          messageId: "otherSlice",
          data: { source },
        });
      }
    });
  },
};

export default noServicesImportInUi;
