import {
  API_SEGMENT,
  SUPABASE_INSTANCE_MODULE,
  UI_SEGMENT,
  fileLocation,
  importEdges,
  specifierLocation,
} from "./segments.mjs";

/**
 * `ui`가 `api`를 당기는 것을 막는다. ADR-015 「계층 셋과 역할 넷」이 presentation의
 * 「모르는 것」에 통신과 캐시와 저장소를 적고, 흐름은 `.tsx` → controller → service →
 * repository로만 간다 — 화면이 repository를 직접 당기면 그 사슬이 한 칸 끊긴다.
 *
 * 세그먼트는 통째로 문다. `queryKeys`·`queryClient`처럼 접미사 없이 `shared/api`에 사는
 * 통신의 약속도 화면이 알 것이 아니다.
 *
 * **면제 둘은 제 규칙으로 간다.** 둘 다 이 규칙이 「아직 못 켠다」로 남는 것을 막으려고
 * 가른 자리고, 빠져나갈 구멍이 아니라 다른 규칙이 든 축이다.
 *
 * - 손잡이(`@/shared/api/supabase`) — SDK를 당기는 것과 손잡이를 받는 것이 다르다
 *   (ADR-015 「집행」의 마지막 문단). `house/no-supabase-instance-in-ui`가 그 축을 든다
 * - `.dto` — DB 열 이름이 뷰에 닿는 축이고 `house/dto-segment`가 든다
 */

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
