import {
  SUPABASE_INSTANCE_MODULE,
  UI_SEGMENT,
  fileLocation,
  importEdges,
} from "./segments.mjs";

const noSupabaseInstanceInUi = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`ui` 세그먼트가 Supabase 클라이언트 실물을 import하는 것을 막는다.",
    },
    schema: [],
    messages: {
      instance:
        "'{{source}}' 는 통신의 손잡이다. 화면 파일은 그것을 쥐지 않으니 `hooks/use<화면>.ts`의 controller가 직접 당기고, `.tsx`는 돌려받은 것만 그려라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.segment !== UI_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      if (node.source.value !== SUPABASE_INSTANCE_MODULE) {
        return;
      }

      context.report({
        node: node.source,
        messageId: "instance",
        data: { source: node.source.value },
      });
    });
  },
};

export default noSupabaseInstanceInUi;
