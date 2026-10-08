import { QUERY_HOOKS, QUERY_PACKAGE } from "./queryHooks.mjs";
import { SERVICES_SEGMENT, fileLocation } from "./segments.mjs";

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
