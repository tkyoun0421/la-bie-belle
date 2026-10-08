import {
  SERVICES_SEGMENT,
  UI_SEGMENT,
  fileLocation,
  importEdges,
  specifierLocation,
} from "./segments.mjs";

/**
 * `ui`가 service를 직접 부르는 것을 막는다. ADR-015 「`ui`가 사는 네 자리」가
 * `screens/<슬라이스>/ui`는 controller를 거치고 `entities/<도메인>/ui`와 `shared/ui`는
 * 부르는 쪽이 값을 들고 온다고 적는다 — controller를 건너뛰면 화면 하나의 교통정리가
 * `.tsx`로 되돌아간다.
 *
 * **`features/<use case>/ui`만 예외고 그것도 자기 슬라이스까지다.** 그 조각이 use case를
 * 실행하는 자리라는 뜻이고, 「근무 신청 보내기」 버튼처럼 눌리면 그 use case가 도는
 * 자리다. 남의 슬라이스 service를 부르면 그 조각이 무슨 use case인지가 흐려진다.
 */

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
