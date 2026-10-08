import {
  API_SEGMENT,
  fileLocation,
  importEdges,
  isTypeOnly,
} from "./segments.mjs";

const SUPABASE_PACKAGE = /^@supabase\//;

const supabasePackageInApi = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`@supabase/*` 패키지를 `api` 세그먼트 밖에서 당기는 것을 막는다.",
    },
    schema: [],
    messages: {
      package:
        "'{{source}}' 는 통신 SDK다. 클라이언트를 만들고 그 타입을 짓는 일은 `api/` 세그먼트가 하니 이 파일을 `api/`로 내리고, 손잡이만 필요하면 `@/shared/api/supabase`를 받아 넘겨라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.segment === API_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source.value;

      if (
        typeof source !== "string" ||
        !SUPABASE_PACKAGE.test(source) ||
        isTypeOnly(node)
      ) {
        return;
      }

      context.report({
        node: node.source,
        messageId: "package",
        data: { source },
      });
    });
  },
};

export default supabasePackageInApi;
