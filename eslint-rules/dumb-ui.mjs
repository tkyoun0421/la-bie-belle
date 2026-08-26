import path from "node:path";

const SUPABASE = /^@supabase\//;
const QUERY_PACKAGE = "@tanstack/react-query";
const PROVIDER_WIRING = "src/app/providers.tsx";
const GLOBALS = new Set(["window", "globalThis", "global", "self"]);

const QUERY_HOOKS = new Set([
  "useQuery",
  "useQueries",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useSuspenseQueries",
  "useSuspenseInfiniteQuery",
  "usePrefetchQuery",
  "usePrefetchInfiniteQuery",
  "useMutation",
  "useMutationState",
  "useIsFetching",
  "useIsMutating",
]);

const dumbUi = {
  meta: {
    type: "problem",
    docs: {
      description:
        "화면 파일이 데이터를 직접 가져오는 것을 막는다. ADR-001 「화면과 로직」의 집행이다.",
    },
    schema: [],
    messages: {
      database:
        "화면 파일은 데이터베이스에 직접 붙지 않는다. '{{source}}' 는 .ts 로 빼라.",
      network: "화면 파일은 직접 통신하지 않는다. fetch 호출을 .ts 로 빼라.",
      queryHook:
        "화면 파일은 서버 상태를 직접 읽지 않는다. '{{hook}}' 호출을 .ts 로 빼라.",
    },
  },
  create(context) {
    const relative = path
      .relative(context.cwd, context.filename)
      .split(path.sep)
      .join("/");
    const wiresProviders = relative === PROVIDER_WIRING;

    const hookBindings = new Map();
    const namespaceBindings = new Set();
    const calls = [];

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (SUPABASE.test(source) && !wiresProviders) {
          context.report({
            node: node.source,
            messageId: "database",
            data: { source },
          });
        }

        if (source !== QUERY_PACKAGE) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === "ImportSpecifier" &&
            QUERY_HOOKS.has(specifier.imported.name)
          ) {
            hookBindings.set(specifier.local.name, specifier.imported.name);
          }
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaceBindings.add(specifier.local.name);
          }
        }
      },

      CallExpression(node) {
        calls.push(node);
      },

      "Program:exit"() {
        for (const node of calls) {
          const { callee } = node;

          if (callee.type === "Identifier") {
            if (callee.name === "fetch") {
              context.report({ node, messageId: "network" });
            } else if (hookBindings.has(callee.name)) {
              context.report({
                node,
                messageId: "queryHook",
                data: { hook: hookBindings.get(callee.name) },
              });
            }
            continue;
          }

          if (
            callee.type !== "MemberExpression" ||
            callee.object.type !== "Identifier"
          ) {
            continue;
          }

          const object = callee.object.name;
          const property = callee.property.name;

          if (GLOBALS.has(object) && property === "fetch") {
            context.report({ node, messageId: "network" });
          } else if (
            namespaceBindings.has(object) &&
            QUERY_HOOKS.has(property)
          ) {
            context.report({
              node,
              messageId: "queryHook",
              data: { hook: property },
            });
          }
        }
      },
    };
  },
};

export default dumbUi;
