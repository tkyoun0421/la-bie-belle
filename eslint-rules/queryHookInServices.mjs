import { QUERY_HOOKS, QUERY_PACKAGE } from "./queryHooks.mjs";
import { SERVICES_SEGMENT, fileLocation } from "./segments.mjs";

/**
 * Query·Mutation 훅을 `services` 세그먼트 안에 묶는다. ADR-015 「세그먼트 열」이
 * `services`와 `hooks`를 **통신을 아느냐**로 가르고, 그 가름이 깨지면 같은 이름 폴더에
 * 역할 둘이 산다 — 화면이 두 service를 묶는 자리는 controller고, 그 묶음이 통신을 새로
 * 열면 `services`로 내려가야 한다.
 *
 * 당기는 자리를 문다. 이름을 바꿔 받아도(`useQuery as useProfileQuery`) 같은 훅이고,
 * 네임스페이스로 받으면 부르는 자리를 본다.
 */

const queryHookInServices = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`services` 세그먼트 밖에서 Query·Mutation 훅을 쓰는 것을 막는다.",
    },
    schema: [],
    messages: {
      queryHook:
        "'{{hook}}' 는 통신을 여는 훅이다. Query·Mutation은 `services/use<Action>Query.ts`·`services/use<Action>Mutation.ts`가 들고, 이 파일은 그것을 불러 쓰기만 해라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.segment === SERVICES_SEGMENT) {
      return {};
    }

    const namespaceBindings = new Set();
    const memberUses = [];

    return {
      ImportDeclaration(node) {
        if (node.source.value !== QUERY_PACKAGE) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaceBindings.add(specifier.local.name);
            continue;
          }

          if (
            specifier.type === "ImportSpecifier" &&
            QUERY_HOOKS.has(specifier.imported.name)
          ) {
            context.report({
              node: specifier,
              messageId: "queryHook",
              data: { hook: specifier.imported.name },
            });
          }
        }
      },

      MemberExpression(node) {
        memberUses.push(node);
      },

      // 네임스페이스 이름은 import 선언을 지나야 알 수 있고 그 선언이 파일 맨 위에
      // 있을 거라는 보장은 없다 — 다 읽은 뒤에 판정한다.
      "Program:exit"() {
        for (const node of memberUses) {
          if (
            node.object.type !== "Identifier" ||
            !namespaceBindings.has(node.object.name) ||
            node.property.type !== "Identifier" ||
            !QUERY_HOOKS.has(node.property.name)
          ) {
            continue;
          }

          context.report({
            node,
            messageId: "queryHook",
            data: { hook: node.property.name },
          });
        }
      },
    };
  },
};

export default queryHookInServices;
