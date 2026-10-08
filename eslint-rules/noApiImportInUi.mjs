import {
  API_SEGMENT,
  SUPABASE_INSTANCE_MODULE,
  UI_SEGMENT,
  fileLocation,
  importEdges,
  specifierLocation,
} from "./segments.mjs";

const DTO_SUFFIX = ".dto";

const noApiImportInUi = {
  meta: {
    type: "problem",
    docs: {
      description: "`ui` 세그먼트가 `api` 세그먼트를 import하는 것을 막는다.",
    },
    schema: [],
    messages: {
      api: "'{{source}}' 는 통신 계층이다. 화면 파일은 통신을 모르니, 이 값이 필요하면 `hooks/use<화면>.ts`의 controller가 service를 거쳐 받아 넘기게 해라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.segment !== UI_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source.value;

      if (
        source === SUPABASE_INSTANCE_MODULE ||
        (typeof source === "string" && source.endsWith(DTO_SUFFIX))
      ) {
        return;
      }

      const there = specifierLocation(source);

      if (there?.segment !== API_SEGMENT) {
        return;
      }

      context.report({
        node: node.source,
        messageId: "api",
        data: { source },
      });
    });
  },
};

export default noApiImportInUi;
