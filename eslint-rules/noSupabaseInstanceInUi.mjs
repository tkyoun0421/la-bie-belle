import {
  SUPABASE_INSTANCE_MODULE,
  UI_SEGMENT,
  fileLocation,
  importEdges,
} from "./segments.mjs";

/**
 * 클라이언트 **실물**을 화면 파일이 쥐는 것을 막는다. 패키지를 당기는 축은
 * `house/supabase-package-in-api`가 들고 여기는 그 뒷겹이다 — ADR-015 「집행」이
 * 「SDK를 당기는 것과 손잡이를 받는 것」으로 둘을 가른 자리다.
 *
 * **무는 자리가 `ui`다.** 실물을 쥐는 자리는 controller 하나여야 하고(`hooks/`가 직접
 * import한다) `.tsx`는 controller가 돌려준 것만 그린다. `src/app/`은 밖이다 — 라우트
 * 파일이라 얇게 남는 자리고 세그먼트가 없어 이 규칙에 안 걸린다.
 */

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
