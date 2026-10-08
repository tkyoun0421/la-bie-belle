import { MUTATION_HOOKS, QUERY_PACKAGE } from "./queryHooks.mjs";
import { fileLocation } from "./segments.mjs";

const ENTITIES_LAYER = "entities";

const entitiesReadOnly = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`entities`에서 쓰기 훅을 쓰는 것을 막는다. 쓰기는 use case라 `features`가 든다.",
    },
    schema: [],
    messages: {
      mutationInEntities:
        "'{{hook}}' 는 쓰기를 여는 훅이고 `entities`는 읽기만 든다. 그 쓰기가 무슨 use case인지를 이름으로 말하는 `features/<use case>/services/use<Action>Mutation.ts`가 가져라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (here?.layer !== ENTITIES_LAYER) {
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
            MUTATION_HOOKS.has(specifier.imported.name)
          ) {
            context.report({
              node: specifier,
              messageId: "mutationInEntities",
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
            !MUTATION_HOOKS.has(node.property.name)
          ) {
            continue;
          }

          context.report({
            node,
            messageId: "mutationInEntities",
            data: { hook: node.property.name },
          });
        }
      },
    };
  },
};

export default entitiesReadOnly;
