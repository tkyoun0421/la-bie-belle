import { fileLocation, importEdges, isTypeOnly } from "./segments.mjs";

const APP_LAYER = "app";
const STORES_SEGMENT = "stores";
const FACTORIES = new Map([
  ["zustand", "create"],
  ["react", "createContext"],
]);
const NAMESPACE_SPECIFIERS = new Set([
  "ImportDefaultSpecifier",
  "ImportNamespaceSpecifier",
]);

const storeFactoryInStores = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`stores` 세그먼트 밖에서 zustand의 `create`와 React의 `createContext`를 부르거나 다시 내보내는 것을 막는다.",
    },
    schema: [],
    messages: {
      factory:
        "'{{factory}}' 는 전역 상태를 낳는다. 상태의 주인은 `stores`뿐이니 `stores/<도메인>.store.ts`·`stores/<도메인>.context.ts`가 만들고, 이 파일은 그것을 불러 읽기만 해라.",
      reexport:
        "'{{factory}}' 를 여기서 다시 내보내면 `stores` 밖에서 전역 상태를 낳는 길이 열린다. 만드는 자리를 `stores`에 두고, 당기는 쪽이 '{{module}}'에서 직접 받게 해라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (!here || here.layer === APP_LAYER || here.segment === STORES_SEGMENT) {
      return {};
    }

    const bindings = new Map();
    const namespaces = new Map();
    const calls = [];

    function readImport(node, factory) {
      for (const specifier of node.specifiers) {
        if (specifier.importKind === "type") {
          continue;
        }

        if (NAMESPACE_SPECIFIERS.has(specifier.type)) {
          namespaces.set(specifier.local.name, factory);
          continue;
        }

        if (
          specifier.type === "ImportSpecifier" &&
          specifier.imported.name === factory
        ) {
          bindings.set(specifier.local.name, factory);
        }
      }
    }

    function readReexport(node, factory) {
      if (node.type === "ExportAllDeclaration") {
        context.report({
          node: node.source,
          messageId: "reexport",
          data: { factory, module: node.source.value },
        });
        return;
      }

      for (const specifier of node.specifiers) {
        if (
          specifier.exportKind === "type" ||
          specifier.local.name !== factory
        ) {
          continue;
        }

        context.report({
          node: specifier,
          messageId: "reexport",
          data: { factory, module: node.source.value },
        });
      }
    }

    function factoryCalledBy(callee) {
      if (callee.type === "Identifier") {
        return bindings.get(callee.name) ?? null;
      }

      if (
        callee.type !== "MemberExpression" ||
        callee.object.type !== "Identifier" ||
        callee.property.type !== "Identifier"
      ) {
        return null;
      }

      const factory = namespaces.get(callee.object.name);

      return factory === callee.property.name ? factory : null;
    }

    return {
      ...importEdges((node) => {
        const factory = FACTORIES.get(node.source.value);

        if (!factory || isTypeOnly(node)) {
          return;
        }

        if (node.type === "ImportDeclaration") {
          readImport(node, factory);
          return;
        }

        readReexport(node, factory);
      }),

      CallExpression(node) {
        calls.push(node);
      },

      "Program:exit"() {
        for (const call of calls) {
          const factory = factoryCalledBy(call.callee);

          if (!factory) {
            continue;
          }

          context.report({
            node: call.callee,
            messageId: "factory",
            data: { factory },
          });
        }
      },
    };
  },
};

export default storeFactoryInStores;
