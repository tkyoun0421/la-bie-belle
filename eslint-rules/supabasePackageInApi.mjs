import {
  API_SEGMENT,
  fileLocation,
  importEdges,
  isTypeOnly,
} from "./segments.mjs";

/**
 * `@supabase/*` 패키지를 당기는 자리를 `api` 세그먼트로 묶는다. ADR-015 「집행」의 첫
 * 줄이고, ADR-003의 「클라이언트는 dals에서만」을 새 세그먼트 이름으로 옮긴 것이다.
 *
 * **막는 것은 패키지를 당기는 것이고 손잡이를 받는 것이 아니다.** SDK를 import하면
 * 클라이언트를 만들거나 그 타입을 짓는 자리고 그것이 `api`의 일이다. 반면
 * `@/shared/api/supabase`의 싱글턴을 받아 아래로 넘기는 것은 화면의 일이라 둘을 한
 * 규칙으로 묶으면 의존성 주입이 선 방식 자체가 막힌다 — 그 축은
 * `house/supabase-instance-in-api`가 따로 든다.
 *
 * **타입만 당기는 것은 통과시킨다.** `User`나 `SupabaseClient`를 받아 서명에 적는 것은
 * 통신을 여는 것이 아니고, 그 꼴을 저장소가 다시 선언하면 SDK가 바뀔 때 어긋난다.
 */

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
