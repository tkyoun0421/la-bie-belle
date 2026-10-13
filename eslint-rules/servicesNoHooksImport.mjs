import {
  HOOKS_SEGMENT,
  SERVICES_SEGMENT,
  fileLocation,
  importEdges,
  importedLocation,
} from "./segments.mjs";

const servicesNoHooksImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`services/`가 `hooks/`를 당기는 것을 막는다. 흐름은 controller → service → repository 한 방향이다.",
    },
    schema: [],
    messages: {
      hooksImport:
        "'{{source}}' 는 `hooks/`의 controller다. service는 controller를 거꾸로 부르지 않는다 — 둘이 같이 쓰는 판정은 `model/`, 값은 `consts/`로 내려 양쪽이 아래에서 당겨라.",
    },
  },
  create(context) {
    if (fileLocation(context)?.segment !== SERVICES_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source?.value;

      if (importedLocation(context, source)?.segment !== HOOKS_SEGMENT) {
        return;
      }

      context.report({
        node: node.source,
        messageId: "hooksImport",
        data: { source },
      });
    });
  },
};

export default servicesNoHooksImport;
